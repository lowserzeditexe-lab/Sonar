from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import re
import httpx
import litellm
from emergentintegrations.llm.chat import get_integration_proxy_url
import json
import asyncio
import time
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'sonar-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Model mapping for LLM providers
MODEL_MAP = {
    "gpt-4o": {"provider": "openai", "model": "gpt-4o"},
    "claude-sonnet": {"provider": "anthropic", "model": "claude-sonnet-4-20250514"},
    "gemini-pro": {"provider": "gemini", "model": "gemini-2.0-flash"},
}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# System prompts for different modes
S1_GENERATE_PROMPT = """You are a stable, methodical React developer (S-1 mode).

Your approach:
1. Read and understand the full request before coding
2. Plan your implementation mentally first
3. Write clean, reliable code
4. Review what you wrote once before finishing
5. Fix any issues you spot
6. Return stable, working code

Priority: STABILITY over speed.
Verify your output is correct before returning it.

Generate a complete React component for the following request.
Use Tailwind CSS for styling. Return ONLY the raw JSX/React code.
Do NOT include markdown code fences. Do NOT include any explanation.
The code must be a single default export React component.
Include all necessary imports (useState, useEffect, etc.) at the top."""

S2_GENERATE_PROMPT = """You are a tenacious, deep-thinking React developer (S-2 mode).

Your approach:
1. Deeply analyze all requirements and edge cases
2. Think about what could go wrong before writing
3. Implement thoroughly — no shortcuts
4. Review your code critically
5. Fix every issue you find, even minor ones
6. Test edge cases mentally: empty states, errors, loading, mobile
7. Refine until you are genuinely satisfied
8. If something seems off, fix it — don't leave it

Priority: DEPTH + TENACITY.
Do not stop until the result is genuinely good.
Go beyond what was asked if it makes the app better.

Generate a complete, production-grade React component for the following request.
Use Tailwind CSS for styling. Return ONLY the raw JSX/React code.
Do NOT include markdown code fences. Do NOT include any explanation.
The code must be a single default export React component.
Include all necessary imports (useState, useEffect, etc.) at the top.
No shortcuts. No placeholder content. Make it production-ready."""

S1_CHAT_PROMPT = """You are modifying an existing React component (S-1 mode).
Current code:
{current_code}

Approach:
- Understand the current code before modifying
- Make the requested change cleanly
- Ensure nothing else breaks
- Return the complete modified code

Return ONLY the complete modified raw JSX/React code.
Do NOT include markdown code fences. Do NOT include any explanation."""

S2_CHAT_PROMPT = """You are improving an existing React component (S-2 mode).
Current code:
{current_code}

Approach:
- Deeply understand the architecture before touching it
- Apply the change + improve anything related
- Check for regressions
- If you notice other issues while working, fix them
- Return a better version of the full component

Return ONLY the complete modified raw JSX/React code.
Do NOT include markdown code fences. Do NOT include any explanation.
Make it genuinely better."""


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    avatar_url: str = ""

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str
    created_at: datetime

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ProjectCreate(BaseModel):
    name: str = "untitled-app"
    prompt: str
    type: str = "custom"  # todo, dashboard, ecommerce, custom
    model: str = "gpt-4o"
    mode: str = "S-1"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    code: Optional[str] = None
    messages: Optional[list] = None
    prompt: Optional[str] = None

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    prompt: str
    type: str
    status: str
    code: str
    messages: list
    model: str
    mode: str
    created_at: str  # ISO string
    updated_at: str  # ISO string

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o"
    mode: str = "S-1"  # "S-1" or "S-2"
    project_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    current_code: str = ""
    model: str = "gpt-4o"
    mode: str = "S-1"
    project_id: Optional[str] = None

class GitHubPushRequest(BaseModel):
    repo_full_name: str    # e.g. "user/my-app"
    branch: str = "main"
    file_path: str = "src/App.jsx"
    content: str           # raw code content
    commit_message: str = "Update generated app"

# JWT Utility Functions
def create_token(user_id: str) -> str:
    """Create a JWT token for the given user ID."""
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify a JWT token and return the payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password (minimum 6 characters)."""
    return len(password) >= 6

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Find user in database
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert ISO string timestamp back to datetime object
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Authentication Routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user."""
    # Validate input
    if not validate_email(user_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if not validate_password(user_data.password):
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    # Insert into database
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_token(user.id)
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )
    
    return AuthResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    """Login a user."""
    # Find user by email
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Convert ISO string timestamp back to datetime object
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Create JWT token
    token = create_token(user.id)
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )
    
    return AuthResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at
    )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Project CRUD Endpoints
@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project_data: ProjectCreate, current_user: User = Depends(get_current_user)):
    """Create a new project."""
    # Generate UUID and timestamps
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create project document
    project_doc = {
        "id": project_id,
        "user_id": current_user.id,
        "name": project_data.name,
        "prompt": project_data.prompt,
        "type": project_data.type,
        "model": project_data.model,
        "mode": project_data.mode,
        "status": "created",
        "code": "",
        "messages": [],
        "created_at": now,
        "updated_at": now
    }
    
    # Insert into database
    await db.projects.insert_one(project_doc)
    
    # Return response
    return ProjectResponse(**project_doc)

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_user_projects(current_user: User = Depends(get_current_user)):
    """Get all projects for the current user."""
    # Find projects by user_id, sorted by updated_at descending
    projects = await db.projects.find(
        {"user_id": current_user.id}, 
        {"_id": 0}
    ).sort("updated_at", -1).to_list(1000)
    
    return [ProjectResponse(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get a single project by ID."""
    # Find by id AND user_id (ownership check)
    project_doc = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id}, 
        {"_id": 0}
    )
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(**project_doc)

@api_router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str, 
    project_update: ProjectUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update a project."""
    # Find by id AND user_id (ownership check)
    existing_project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id}, 
        {"_id": 0}
    )
    
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build update document with only non-None fields
    update_doc = {}
    if project_update.name is not None:
        update_doc["name"] = project_update.name
    if project_update.status is not None:
        update_doc["status"] = project_update.status
    if project_update.code is not None:
        update_doc["code"] = project_update.code
    if project_update.messages is not None:
        update_doc["messages"] = project_update.messages
    if project_update.prompt is not None:
        update_doc["prompt"] = project_update.prompt
    
    # Always update updated_at
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update in database
    await db.projects.update_one(
        {"id": project_id, "user_id": current_user.id},
        {"$set": update_doc}
    )
    
    # Return updated project
    updated_project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id}, 
        {"_id": 0}
    )
    
    return ProjectResponse(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Delete a project."""
    # Find and delete by id AND user_id (ownership check)
    result = await db.projects.delete_one(
        {"id": project_id, "user_id": current_user.id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"deleted": True}


async def get_optional_user(req: Request):
    """Extract authenticated user from request (optional — returns None if not authenticated)."""
    user = None
    auth_header = req.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token_str = auth_header.split(" ")[1]
            payload = verify_token(token_str)
            user_id = payload.get("user_id")
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user_doc:
                user = user_doc
        except Exception:
            pass
    return user


# ── Social OAuth helpers ──────────────────────────────────────────────────────

async def upsert_social_user(email: str, name: str, avatar_url: str = "") -> tuple[User, str]:
    """Find or create a user by email (social login), return (user, jwt_token)."""
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        # Update name/avatar if changed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "avatar_url": avatar_url}}
        )
        if isinstance(existing.get("created_at"), str):
            existing["created_at"] = datetime.fromisoformat(existing["created_at"])
        # Ensure password_hash exists
        if "password_hash" not in existing:
            existing["password_hash"] = ""
        user = User(**existing)
    else:
        user = User(name=name, email=email, password_hash="", avatar_url=avatar_url)
        user_doc = user.model_dump()
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        await db.users.insert_one(user_doc)

    token = create_token(user.id)
    return user, token


class GoogleCallbackRequest(BaseModel):
    session_id: str

class GitHubCallbackRequest(BaseModel):
    code: str
    redirect_uri: str

class DiscordCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


@api_router.post("/auth/google/callback", response_model=AuthResponse)
async def google_callback(body: GoogleCallbackRequest):
    """Exchange Emergent Auth session_id for user data and return JWT."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
            timeout=15,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google session")

    data = resp.json()
    email = data.get("email", "")
    name = data.get("name", "") or email.split("@")[0]
    avatar = data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email returned from Google")

    user, token = await upsert_social_user(email, name, avatar)
    return AuthResponse(
        token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email,
                          avatar_url=user.avatar_url, created_at=user.created_at)
    )


@api_router.post("/auth/github/callback", response_model=AuthResponse)
async def github_callback(body: GitHubCallbackRequest):
    """Exchange GitHub OAuth code for user data and return JWT."""
    github_client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    github_client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": github_client_id,
                "client_secret": github_client_secret,
                "code": body.code,
                "redirect_uri": body.redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=15,
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub auth failed")

        # Get user profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            timeout=15,
        )
        gh_user = user_resp.json()

        # Get primary email if not public
        email = gh_user.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=15,
            )
            emails = emails_resp.json()
            primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
            email = primary or (emails[0]["email"] if emails else None)

    if not email:
        raise HTTPException(status_code=400, detail="No email returned from GitHub")

    name = gh_user.get("name") or gh_user.get("login") or email.split("@")[0]
    avatar = gh_user.get("avatar_url", "")

    user, token = await upsert_social_user(email, name, avatar)

    # Also store github_access_token so GitHub repo integration works automatically
    # after login — if the token has repo scope, repos will be accessible
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"github_access_token": access_token}}
    )

    return AuthResponse(
        token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email,
                          avatar_url=user.avatar_url, created_at=user.created_at)
    )


@api_router.post("/auth/discord/callback", response_model=AuthResponse)
async def discord_callback(body: DiscordCallbackRequest):
    """Exchange Discord OAuth code for user data and return JWT."""
    discord_client_id = os.environ.get("DISCORD_CLIENT_ID", "")
    discord_client_secret = os.environ.get("DISCORD_CLIENT_SECRET", "")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": discord_client_id,
                "client_secret": discord_client_secret,
                "grant_type": "authorization_code",
                "code": body.code,
                "redirect_uri": body.redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            raise HTTPException(status_code=400, detail="Discord auth failed")

        # Get user profile
        user_resp = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        dc_user = user_resp.json()

    email = dc_user.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="No email returned from Discord. Make sure email scope is granted.")

    username = dc_user.get("global_name") or dc_user.get("username") or email.split("@")[0]
    avatar_hash = dc_user.get("avatar")
    avatar = f"https://cdn.discordapp.com/avatars/{dc_user['id']}/{avatar_hash}.png" if avatar_hash else ""

    user, token = await upsert_social_user(email, username, avatar)
    return AuthResponse(
        token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email,
                          avatar_url=user.avatar_url, created_at=user.created_at)
    )
    """Extract authenticated user from request (optional — returns None if not authenticated)."""
    user = None
    auth_header = req.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token_str = auth_header.split(" ")[1]
            payload = verify_token(token_str)
            user_id = payload.get("user_id")
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user_doc:
                user = user_doc
        except Exception:
            pass
    return user


# ── GitHub Integration endpoints ──────────────────────────────────────────────

class GitHubConnectRequest(BaseModel):
    code: str
    redirect_uri: str

@api_router.post("/github/connect")
async def github_connect(body: GitHubConnectRequest, current_user: User = Depends(get_current_user)):
    """Exchange GitHub OAuth code (repo scope) for access_token, store it for the user."""
    github_client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    github_client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": github_client_id,
                "client_secret": github_client_secret,
                "code": body.code,
                "redirect_uri": body.redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=15,
        )
        token_data = token_resp.json()

    access_token = token_data.get("access_token", "")
    if not access_token:
        raise HTTPException(status_code=400, detail="GitHub connect failed — invalid code")

    # Store access_token for this user
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"github_access_token": access_token}}
    )
    return {"connected": True}


@api_router.get("/github/repos")
async def github_repos(current_user: User = Depends(get_current_user)):
    """List GitHub repos for the connected user."""
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    access_token = user_doc.get("github_access_token", "") if user_doc else ""

    if not access_token:
        raise HTTPException(status_code=403, detail="GitHub not connected")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos?per_page=50&sort=updated&affiliation=owner,collaborator",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            timeout=15,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch repos")

    repos = resp.json()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "full_name": r["full_name"],
            "private": r["private"],
            "default_branch": r.get("default_branch", "main"),
            "description": r.get("description", ""),
        }
        for r in repos
    ]


@api_router.get("/github/branches/{owner}/{repo}")
async def github_branches(owner: str, repo: str, current_user: User = Depends(get_current_user)):
    """List branches for a repo."""
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    access_token = user_doc.get("github_access_token", "") if user_doc else ""
    if not access_token:
        raise HTTPException(status_code=403, detail="GitHub not connected")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/branches",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            timeout=15,
        )
    if resp.status_code != 200:
        return [{"name": "main"}]

    branches = resp.json()
    return [{"name": b["name"]} for b in branches]


@api_router.post("/github/push")
async def github_push(body: GitHubPushRequest, current_user: User = Depends(get_current_user)):
    """Push generated code to a GitHub repo file."""
    import base64 as b64

    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    access_token = user_doc.get("github_access_token", "") if user_doc else ""
    if not access_token:
        raise HTTPException(status_code=403, detail="GitHub not connected")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient() as client:
        # Check if file already exists to get its SHA
        existing_resp = await client.get(
            f"https://api.github.com/repos/{body.repo_full_name}/contents/{body.file_path}",
            headers=headers,
            params={"ref": body.branch},
            timeout=15,
        )
        sha = existing_resp.json().get("sha") if existing_resp.status_code == 200 else None

        # Encode content in base64
        encoded_content = b64.b64encode(body.content.encode("utf-8")).decode("utf-8")

        payload = {
            "message": body.commit_message,
            "content": encoded_content,
            "branch": body.branch,
        }
        if sha:
            payload["sha"] = sha

        push_resp = await client.put(
            f"https://api.github.com/repos/{body.repo_full_name}/contents/{body.file_path}",
            headers=headers,
            json=payload,
            timeout=30,
        )

    if push_resp.status_code not in (200, 201):
        detail = push_resp.json().get("message", "Push failed")
        raise HTTPException(status_code=400, detail=detail)

    result = push_resp.json()
    return {
        "pushed": True,
        "commit_sha": result.get("commit", {}).get("sha", ""),
        "html_url": result.get("content", {}).get("html_url", ""),
    }


@api_router.get("/github/status")
async def github_status(current_user: User = Depends(get_current_user)):
    """Check if GitHub is connected for the current user."""
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    access_token = user_doc.get("github_access_token", "") if user_doc else ""
    
    if not access_token:
        return {"connected": False}

    # Verify token is still valid
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    if resp.status_code == 200:
        gh = resp.json()
        return {"connected": True, "github_login": gh.get("login", ""), "github_avatar": gh.get("avatar_url", "")}
    else:
        # Token expired/revoked
        await db.users.update_one({"id": current_user.id}, {"$unset": {"github_access_token": ""}})
        return {"connected": False}


@api_router.post("/github/disconnect")
async def github_disconnect(current_user: User = Depends(get_current_user)):
    """Remove stored GitHub access token for the current user."""
    await db.users.update_one({"id": current_user.id}, {"$unset": {"github_access_token": ""}})
    return {"disconnected": True}


# ──────────────────────────────────────────────────────────────
# E2B Sandbox endpoints — live preview deployment
# ──────────────────────────────────────────────────────────────

class SandboxDeployRequest(BaseModel):
    code: str


def _generate_preview_html(code: str) -> str:
    """
    Generate a standalone HTML file that renders the AI-generated React component.
    Uses CDN React + Tailwind + Babel — same approach as the in-app iframe preview.
    The code is JSON-encoded to avoid escaping issues.
    """
    # JSON-encode the code so it's safe to embed in a <script> tag
    code_json = json.dumps(code)
    # Extra safety: replace </script with <\/script to avoid HTML parser issues
    code_json_safe = code_json.replace("</", "<\\/")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Preview — Sonar</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"><\/script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: system-ui, -apple-system, sans-serif; }}
    #root {{ min-height: 100vh; }}
    #error-display {{
      padding: 20px; color: #ef4444; font-family: monospace;
      font-size: 13px; background: #1a1a1a; min-height: 100vh; display: none;
    }}
    #error-display h3 {{ margin-bottom: 8px; font-size: 14px; }}
    #error-display pre {{ white-space: pre-wrap; word-break: break-word; }}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display"><h3>Preview Error</h3><pre id="error-text"></pre></div>
  <script>
    function renderCode(rawCode) {{
      var root = document.getElementById("root");
      var errorDisplay = document.getElementById("error-display");
      var errorText = document.getElementById("error-text");

      root.style.display = "block";
      errorDisplay.style.display = "none";

      try {{
        var code = rawCode;

        // Remove import statements (available globally via CDN)
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]react['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]recharts['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]lucide-react['"];?\\s*$/gm, "");
        code = code.replace(/^\\s*import\\s+.*?from\\s+['"]react-dom['"];?\\s*$/gm, "");

        // Replace "export default function X" with "function X"
        code = code.replace(/export\\s+default\\s+function\\s+/g, "function ");

        // Replace "export default X" with "var __DefaultExport__ = X"
        code = code.replace(/^\\s*export\\s+default\\s+/gm, "var __DefaultExport__ = ");

        var wrappedCode = code + "\\n" +
          "var _Component = typeof App !== 'undefined' ? App\\n" +
          "  : typeof Counter !== 'undefined' ? Counter\\n" +
          "  : typeof CounterApp !== 'undefined' ? CounterApp\\n" +
          "  : typeof TodoApp !== 'undefined' ? TodoApp\\n" +
          "  : typeof Dashboard !== 'undefined' ? Dashboard\\n" +
          "  : typeof Store !== 'undefined' ? Store\\n" +
          "  : typeof MainApp !== 'undefined' ? MainApp\\n" +
          "  : typeof Home !== 'undefined' ? Home\\n" +
          "  : typeof Main !== 'undefined' ? Main\\n" +
          "  : typeof Page !== 'undefined' ? Page\\n" +
          "  : typeof __DefaultExport__ !== 'undefined' ? __DefaultExport__\\n" +
          "  : null;\\n" +
          "if (_Component) {{\\n" +
          "  var _root = ReactDOM.createRoot(document.getElementById('root'));\\n" +
          "  _root.render(React.createElement(_Component));\\n" +
          "}} else {{\\n" +
          "  document.getElementById('root').innerHTML = '<div style=\\"padding:40px;color:#888\\">No component found to render</div>';\\n" +
          "}}\\n";

        var globals =
          "var useState = React.useState;\\n" +
          "var useEffect = React.useEffect;\\n" +
          "var useCallback = React.useCallback;\\n" +
          "var useMemo = React.useMemo;\\n" +
          "var useRef = React.useRef;\\n" +
          "var useContext = React.useContext;\\n" +
          "var useReducer = React.useReducer;\\n" +
          "var createContext = React.createContext;\\n" +
          "var memo = React.memo;\\n" +
          "var Fragment = React.Fragment;\\n" +
          "var useId = React.useId || function() {{ return Math.random().toString(36).slice(2); }};\\n";

        if (window.Recharts) {{
          Object.keys(window.Recharts).forEach(function(k) {{
            globals += "var " + k + " = window.Recharts." + k + ";\\n";
          }});
        }}

        var output = Babel.transform(globals + wrappedCode, {{
          presets: ["react"],
          filename: "App.jsx"
        }});

        (new Function(output.code))();

      }} catch (err) {{
        root.style.display = "none";
        errorDisplay.style.display = "block";
        errorText.textContent = err.message + "\\n\\n" + (err.stack || "");
      }}
    }}

    // Load the embedded code
    var EMBEDDED_CODE = {code_json_safe};
    // Wait for CDN scripts to load before rendering
    window.addEventListener("load", function() {{ renderCode(EMBEDDED_CODE); }});
  </script>
</body>
</html>"""


def _create_e2b_sandbox_sync(html: str) -> dict:
    """
    Creates an E2B sandbox, writes the HTML file, starts an HTTP server,
    and returns the sandbox_id and preview_url. Runs synchronously in a thread.
    """
    from e2b import Sandbox

    # E2B_API_KEY is read from environment automatically
    # Create sandbox with 30 min timeout
    sandbox = Sandbox.create(timeout=1800)

    # Write the HTML file
    sandbox.files.write("/home/user/index.html", html)

    # Start HTTP server on port 3000 in background
    sandbox.commands.run(
        "cd /home/user && python3 -m http.server 3000",
        background=True,
    )

    # Give the server a moment to start
    time.sleep(3)

    # Get the public preview URL
    host = sandbox.get_host(3000)
    preview_url = f"https://{host}"

    return {
        "sandbox_id": sandbox.sandbox_id,
        "preview_url": preview_url,
    }


@api_router.post("/sandbox/deploy")
async def deploy_sandbox(request: SandboxDeployRequest, req: Request):
    """
    Deploy AI-generated React code to an E2B cloud sandbox.
    Returns a live preview URL accessible from any browser.
    """
    e2b_key = os.environ.get("E2B_API_KEY", "")
    if not e2b_key:
        raise HTTPException(status_code=500, detail="E2B_API_KEY not configured on the server")

    if not request.code or len(request.code) < 10:
        raise HTTPException(status_code=400, detail="Code is too short to deploy")

    html = _generate_preview_html(request.code)
    try:
        result = await asyncio.to_thread(_create_e2b_sandbox_sync, html)
        return result
    except Exception as e:
        logger.error(f"E2B sandbox creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sandbox creation failed: {str(e)}")


def _kill_sandbox_sync(sandbox_id: str) -> None:
    """Kill an E2B sandbox. Runs synchronously in a thread."""
    from e2b import Sandbox
    try:
        sbx = Sandbox.connect(sandbox_id)
        sbx.kill()
    except Exception as e:
        logger.warning(f"Failed to kill sandbox {sandbox_id}: {e}")


@api_router.delete("/sandbox/{sandbox_id}")
async def delete_sandbox(sandbox_id: str, req: Request):
    """Kill an E2B sandbox to free up resources."""
    await asyncio.to_thread(_kill_sandbox_sync, sandbox_id)
    return {"deleted": True, "sandbox_id": sandbox_id}


# ──────────────────────────────────────────────────────────────
# E2B VS Code (code-server) codebase per project
# ──────────────────────────────────────────────────────────────

import secrets as _secrets
import string as _string


def _generate_vscode_password(length: int = 20) -> str:
    """Generate a cryptographically secure password for code-server."""
    alphabet = _string.ascii_letters + _string.digits
    return ''.join(_secrets.choice(alphabet) for _ in range(length))


def _create_vscode_sandbox_sync(project_code: str = "") -> dict:
    """
    Creates an E2B sandbox, installs code-server, configures it with a password,
    writes the project code to the workspace, starts code-server, and returns
    the public VS Code URL + password + sandbox_id.
    """
    from e2b import Sandbox

    api_key = os.environ.get("E2B_API_KEY", "")
    password = _generate_vscode_password()

    # Create sandbox with 1h timeout
    sandbox = Sandbox.create(api_key=api_key, timeout=3600)
    sandbox_id = sandbox.sandbox_id

    try:
        # Install code-server (standalone — no root needed)
        sandbox.commands.run(
            "curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone 2>&1 | tail -3",
            timeout=180,
        )

        # Create config dir and write password config
        sandbox.commands.run("mkdir -p /home/user/.config/code-server", timeout=15)
        config_yaml = f"""bind-addr: 0.0.0.0:8080
auth: password
password: {password}
cert: false
"""
        sandbox.files.write("/home/user/.config/code-server/config.yaml", config_yaml)

        # Create workspace and write project code
        sandbox.commands.run("mkdir -p /home/user/workspace", timeout=15)

        if project_code and len(project_code) > 20:
            sandbox.files.write("/home/user/workspace/App.jsx", project_code)
        else:
            # Write a placeholder if no code yet
            placeholder = """// Your generated code will appear here.\n// Come back after generating your app!\n"""
            sandbox.files.write("/home/user/workspace/App.jsx", placeholder)

        # Start code-server in background
        sandbox.commands.run(
            "HOME=/home/user nohup /home/user/.local/bin/code-server "
            "--bind-addr 0.0.0.0:8080 /home/user/workspace > /home/user/code-server.log 2>&1 &",
            background=True,
        )

        # Wait a few seconds for code-server to come up
        time.sleep(6)

        # Get public URL
        host = sandbox.get_host(8080)
        vscode_url = f"https://{host}"

        return {
            "sandbox_id": sandbox_id,
            "vscode_url": vscode_url,
            "vscode_password": password,
        }

    except Exception:
        # Kill sandbox on error
        try:
            sandbox.kill()
        except Exception:
            pass
        raise


@api_router.post("/projects/{project_id}/codebase")
async def create_project_codebase(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Provision (or retrieve) an E2B VS Code environment for a project.
    Creates a code-server sandbox with the project's generated code.
    If the sandbox already exists, returns the stored credentials.
    """
    # Fetch the project (ownership check)
    project_doc = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id},
        {"_id": 0},
    )
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")

    # If codebase already exists, return it immediately
    if project_doc.get("vscode_sandbox_id") and project_doc.get("vscode_url"):
        return {
            "sandbox_id": project_doc["vscode_sandbox_id"],
            "vscode_url": project_doc["vscode_url"],
            "vscode_password": project_doc.get("vscode_password", ""),
            "status": "ready",
        }

    # Otherwise provision a new sandbox
    e2b_key = os.environ.get("E2B_API_KEY", "")
    if not e2b_key:
        raise HTTPException(status_code=500, detail="E2B_API_KEY not configured")

    project_code = project_doc.get("code", "")

    try:
        result = await asyncio.to_thread(_create_vscode_sandbox_sync, project_code)
    except Exception as e:
        logger.error(f"VS Code sandbox creation failed for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"VS Code environment creation failed: {str(e)}")

    # Persist sandbox info to project
    await db.projects.update_one(
        {"id": project_id, "user_id": current_user.id},
        {
            "$set": {
                "vscode_sandbox_id": result["sandbox_id"],
                "vscode_url": result["vscode_url"],
                "vscode_password": result["vscode_password"],
                "vscode_created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {
        "sandbox_id": result["sandbox_id"],
        "vscode_url": result["vscode_url"],
        "vscode_password": result["vscode_password"],
        "status": "ready",
    }


@api_router.get("/projects/{project_id}/codebase")
async def get_project_codebase(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return stored VS Code environment info for a project (if it exists)."""
    project_doc = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id},
        {"_id": 0},
    )
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project_doc.get("vscode_sandbox_id"):
        raise HTTPException(status_code=404, detail="No VS Code environment for this project")

    return {
        "sandbox_id": project_doc["vscode_sandbox_id"],
        "vscode_url": project_doc["vscode_url"],
        "vscode_password": project_doc.get("vscode_password", ""),
        "status": "ready",
    }


@api_router.delete("/projects/{project_id}/codebase")
async def delete_project_codebase(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Kill and remove the VS Code environment for a project."""
    project_doc = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id},
        {"_id": 0},
    )
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")

    sandbox_id = project_doc.get("vscode_sandbox_id")
    if sandbox_id:
        await asyncio.to_thread(_kill_sandbox_sync, sandbox_id)

    await db.projects.update_one(
        {"id": project_id, "user_id": current_user.id},
        {"$unset": {"vscode_sandbox_id": "", "vscode_url": "", "vscode_password": "", "vscode_created_at": ""}},
    )

    return {"deleted": True, "project_id": project_id}


# ──────────────────────────────────────────────────────────────
# Pre-provisioning: VS Code sandbox created BEFORE project exists
# Used in CostPreviewModal to provision in parallel with generation
# ──────────────────────────────────────────────────────────────

# In-memory store for pre-provisioned sandboxes
# { provision_id: { status, sandbox_id, vscode_url, vscode_password, error } }
_vscode_provisions: dict = {}


def _provision_vscode_background(provision_id: str) -> None:
    """
    Full E2B provisioning run synchronously in a thread.
    Updates _vscode_provisions dict with progress.
    Stages: sandbox_created → installing → configuring → ready
    """
    from e2b import Sandbox

    api_key = os.environ.get("E2B_API_KEY", "")
    password = _generate_vscode_password()
    store = _vscode_provisions[provision_id]

    try:
        # Stage 1: Create sandbox (fast ~0.5s)
        sandbox = Sandbox.create(api_key=api_key, timeout=3600)
        sandbox_id = sandbox.sandbox_id
        store["sandbox_id"] = sandbox_id
        store["status"] = "sandbox_created"   # → step 2 done in frontend

        # Stage 2: Install code-server (~30s)
        store["status"] = "installing"         # → step 3 active
        sandbox.commands.run(
            "curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone 2>&1 | tail -3",
            timeout=180,
        )

        # Stage 3: Configure
        store["status"] = "configuring"        # → step 3 done, step 4 active
        sandbox.commands.run("mkdir -p /home/user/.config/code-server", timeout=15)
        config_yaml = f"""bind-addr: 0.0.0.0:8080
auth: password
password: {password}
cert: false
"""
        sandbox.files.write("/home/user/.config/code-server/config.yaml", config_yaml)
        sandbox.commands.run("mkdir -p /home/user/workspace", timeout=15)
        sandbox.files.write(
            "/home/user/workspace/App.jsx",
            "// Your generated app will appear here once generation completes.\n"
        )

        # Stage 4: Start code-server
        sandbox.commands.run(
            "HOME=/home/user nohup /home/user/.local/bin/code-server "
            "--bind-addr 0.0.0.0:8080 /home/user/workspace > /home/user/code-server.log 2>&1 &",
            background=True,
        )
        time.sleep(6)  # Let code-server start

        # Get public URL
        host = sandbox.get_host(8080)
        vscode_url = f"https://{host}"

        store["vscode_url"] = vscode_url
        store["vscode_password"] = password
        store["status"] = "ready"              # → all 4 steps done

    except Exception as e:
        logger.error(f"VS Code pre-provisioning failed [{provision_id}]: {e}")
        store["status"] = "error"
        store["error"] = str(e)
        # Attempt cleanup
        if store.get("sandbox_id"):
            try:
                from e2b import Sandbox
                sbx = Sandbox.connect(store["sandbox_id"])
                sbx.kill()
            except Exception:
                pass


@api_router.post("/sandbox/vscode/provision")
async def provision_vscode_sandbox(req: Request):
    """
    Pre-provision a VS Code sandbox before the project is created.
    Returns provision_id immediately; actual creation runs in background.
    Requires authentication.
    """
    # Optional auth — only provision for authenticated users
    auth_header = req.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    e2b_key = os.environ.get("E2B_API_KEY", "")
    if not e2b_key:
        raise HTTPException(status_code=500, detail="E2B_API_KEY not configured")

    provision_id = str(uuid.uuid4())
    _vscode_provisions[provision_id] = {
        "status": "starting",   # immediately set to 'starting' for step 1
        "sandbox_id": None,
        "vscode_url": None,
        "vscode_password": None,
        "error": None,
    }

    # Start in background thread (non-blocking)
    asyncio.get_event_loop().run_in_executor(
        None, _provision_vscode_background, provision_id
    )

    return {"provision_id": provision_id, "status": "starting"}


@api_router.get("/sandbox/vscode/provision/{provision_id}/status")
async def get_provision_status(provision_id: str, req: Request):
    """Poll the status of a VS Code pre-provisioning request."""
    # Optional auth check
    auth_header = req.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    store = _vscode_provisions.get(provision_id)
    if not store:
        raise HTTPException(status_code=404, detail="Provision not found")

    return {
        "provision_id": provision_id,
        "status": store["status"],
        "error": store.get("error"),
    }


class AttachCodebaseRequest(BaseModel):
    provision_id: str


@api_router.post("/projects/{project_id}/codebase/attach")
async def attach_provision_to_project(
    project_id: str,
    body: AttachCodebaseRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Attach a pre-provisioned VS Code sandbox to a project.
    Called after project creation + sandbox is ready.
    """
    project_doc = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id},
        {"_id": 0},
    )
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")

    provision_id = body.provision_id
    store = _vscode_provisions.get(provision_id)
    if not store:
        raise HTTPException(status_code=404, detail="Provision not found")

    if store["status"] == "error":
        raise HTTPException(status_code=500, detail=f"Provision failed: {store.get('error', 'unknown')}")

    if store["status"] != "ready":
        # Still provisioning — store partially (will be updated later)
        await db.projects.update_one(
            {"id": project_id, "user_id": current_user.id},
            {"$set": {
                "vscode_sandbox_id": store.get("sandbox_id"),
                "vscode_url": store.get("vscode_url"),
                "vscode_password": store.get("vscode_password"),
                "vscode_provision_id": provision_id,
                "vscode_created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return {"attached": True, "status": store["status"], "provision_id": provision_id}

    # Ready — attach all credentials
    await db.projects.update_one(
        {"id": project_id, "user_id": current_user.id},
        {"$set": {
            "vscode_sandbox_id": store["sandbox_id"],
            "vscode_url": store["vscode_url"],
            "vscode_password": store["vscode_password"],
            "vscode_provision_id": provision_id,
            "vscode_created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    # Remove from in-memory store
    _vscode_provisions.pop(provision_id, None)

    return {
        "attached": True,
        "status": "ready",
        "vscode_url": store["vscode_url"],
        "vscode_password": store["vscode_password"],
        "sandbox_id": store["sandbox_id"],
    }


def clean_code_fences(text: str) -> str:
    """Remove markdown code fences from LLM output."""
    code = text.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        lines = lines[1:]  # Remove first line (```jsx or similar)
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        code = "\n".join(lines)
    return code.strip()


def build_litellm_params(model_key: str, system_prompt: str, user_prompt: str) -> dict:
    """Build litellm completion params with Emergent proxy support."""
    model_config = MODEL_MAP.get(model_key, MODEL_MAP["gpt-4o"])
    llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
    proxy_url = get_integration_proxy_url()

    provider = model_config["provider"]
    model_name = model_config["model"]

    # Resolve model string for litellm
    if llm_key.startswith("sk-emergent-"):
        # Route through Emergent proxy
        litellm_model = f"gemini/{model_name}" if provider == "gemini" else model_name
        params = {
            "model": litellm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "api_key": llm_key,
            "api_base": proxy_url + "/llm",
            "custom_llm_provider": "openai",
            "stream": True,
        }
    else:
        # Direct provider call
        if provider == "gemini":
            litellm_model = f"gemini/{model_name}"
        elif provider == "anthropic":
            litellm_model = f"anthropic/{model_name}"
        else:
            litellm_model = model_name
        params = {
            "model": litellm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "api_key": llm_key,
            "stream": True,
        }

    return params


@api_router.post("/generate")
async def generate_code(request: GenerateRequest, req: Request):
    """Generate React component code using LLM with real token-by-token streaming."""
    user = await get_optional_user(req)

    async def event_stream():
        full_code_buffer = ""
        try:
            # Pick system prompt by mode
            system_prompt = S1_GENERATE_PROMPT if request.mode == "S-1" else S2_GENERATE_PROMPT

            # Build litellm params with streaming
            params = build_litellm_params(request.model, system_prompt, request.prompt)

            # Real token streaming
            response = await litellm.acompletion(**params)

            async for chunk in response:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_code_buffer += delta
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta})}\n\n"

            # Clean code fences from the complete buffer
            final_code = clean_code_fences(full_code_buffer)

            # Send done event with full cleaned code
            yield f"data: {json.dumps({'type': 'done', 'full_code': final_code})}\n\n"

            # Persist to project if authenticated
            if user and request.project_id:
                await db.projects.update_one(
                    {"id": request.project_id, "user_id": user["id"]},
                    {"$set": {
                        "code": final_code,
                        "status": "complete",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }}
                )

        except Exception as e:
            logger.error(f"Generate error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@api_router.post("/chat")
async def chat_with_code(request: ChatRequest, req: Request):
    """Modify existing React code via LLM with real token-by-token streaming."""
    user = await get_optional_user(req)

    async def event_stream():
        full_code_buffer = ""
        try:
            # Build system prompt with current code injected
            if request.mode == "S-1":
                system_prompt = S1_CHAT_PROMPT.format(current_code=request.current_code)
            else:
                system_prompt = S2_CHAT_PROMPT.format(current_code=request.current_code)

            # Build litellm params with streaming
            params = build_litellm_params(request.model, system_prompt, request.message)

            # Real token streaming
            response = await litellm.acompletion(**params)

            async for chunk in response:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_code_buffer += delta
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta})}\n\n"

            # Clean code fences
            final_code = clean_code_fences(full_code_buffer)

            # Send done event
            yield f"data: {json.dumps({'type': 'done', 'full_code': final_code})}\n\n"

            # Persist to project if authenticated
            if user and request.project_id:
                await db.projects.update_one(
                    {"id": request.project_id, "user_id": user["id"]},
                    {"$set": {
                        "code": final_code,
                        "status": "complete",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }}
                )

        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()