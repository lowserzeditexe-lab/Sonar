import requests
import sys
from datetime import datetime
import json

class SonarAPITester:
    def __init__(self, base_url="https://takeover-app-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_register_user(self):
        """Test user registration with unique email"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"newtest{timestamp}@test.com",  # Using unique email as specified
            "password": "testtest"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.test_email = test_data['email']  # Store for later use
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User email: {self.test_email}")
            return True
        return False

    def test_login_user(self):
        """Test user login with provided credentials"""
        login_data = {
            "email": "test@test.com",
            "password": "testtest"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        return success and 'id' in response

    def test_create_project(self):
        """Test creating a new project"""
        project_data = {
            "name": "test-app",
            "prompt": "Build a simple todo app with React",
            "type": "todo",
            "model": "gpt-4o",
            "mode": "S-1"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "api/projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Project ID: {self.project_id}")
            return True
        return False

    def test_get_projects(self):
        """Test getting user projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "api/projects",
            200
        )
        return success and isinstance(response, list)

    def test_get_project(self):
        """Test getting a specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Project",
            "GET",
            f"api/projects/{self.project_id}",
            200
        )
        return success and response.get('id') == self.project_id

    def test_update_project(self):
        """Test updating a project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        update_data = {
            "status": "complete",
            "code": "function App() { return <div>Hello World</div>; }"
        }
        
        success, response = self.run_test(
            "Update Project",
            "PATCH",
            f"api/projects/{self.project_id}",
            200,
            data=update_data
        )
        return success and response.get('status') == 'complete'

    def test_vscode_provision_endpoint(self):
        """Test VS Code pre-provisioning endpoint (new E2B feature)"""
        success, response = self.run_test(
            "VS Code Pre-Provision",
            "POST",
            "api/sandbox/vscode/provision",
            200
        )
        
        if success and 'provision_id' in response:
            self.provision_id = response['provision_id']
            print(f"   Provision ID: {self.provision_id}")
            print(f"   Initial Status: {response.get('status', 'N/A')}")
            return True
        return False

    def test_vscode_provision_status(self):
        """Test VS Code provision status polling endpoint"""
        if not hasattr(self, 'provision_id') or not self.provision_id:
            print("❌ No provision ID available for testing")
            return False
            
        success, response = self.run_test(
            "VS Code Provision Status",
            "GET",
            f"api/sandbox/vscode/provision/{self.provision_id}/status",
            200
        )
        
        if success:
            expected_fields = ['provision_id', 'status']
            has_all_fields = all(field in response for field in expected_fields)
            if has_all_fields:
                print(f"   Status: {response.get('status', 'N/A')}")
                print(f"   Error: {response.get('error', 'None')}")
                return True
            else:
                print(f"❌ Missing expected fields in response: {response}")
        return False

    def test_attach_provision_to_project(self):
        """Test attaching pre-provisioned VS Code to project"""
        if not self.project_id or not hasattr(self, 'provision_id'):
            print("❌ No project ID or provision ID available for testing")
            return False
            
        attach_data = {
            "provision_id": self.provision_id
        }
        
        success, response = self.run_test(
            "Attach Provision to Project",
            "POST",
            f"api/projects/{self.project_id}/codebase/attach",
            200,
            data=attach_data
        )
        
        if success:
            expected_fields = ['attached', 'status']
            has_all_fields = all(field in response for field in expected_fields)
            if has_all_fields:
                print(f"   Attached: {response.get('attached', 'N/A')}")
                print(f"   Status: {response.get('status', 'N/A')}")
                return True
            else:
                print(f"❌ Missing expected fields in response: {response}")
        return False

    def test_codebase_creation_endpoint(self):
        """Test VS Code codebase creation endpoint (should work but take time)"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        print("⚠️  Note: This test may take 60+ seconds for E2B provisioning...")
        success, response = self.run_test(
            "Create VS Code Codebase",
            "POST",
            f"api/projects/{self.project_id}/codebase",
            200
        )
        
        if success:
            expected_fields = ['sandbox_id', 'vscode_url', 'vscode_password', 'status']
            has_all_fields = all(field in response for field in expected_fields)
            if has_all_fields:
                print(f"   VS Code URL: {response.get('vscode_url', 'N/A')}")
                print(f"   Status: {response.get('status', 'N/A')}")
                return True
            else:
                print(f"❌ Missing expected fields in response: {response}")
        return False

    def test_delete_project(self):
        """Test deleting a project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Project",
            "DELETE",
            f"api/projects/{self.project_id}",
            200
        )
        return success and response.get('deleted') == True

def main():
    print("🚀 Starting Sonar API Backend Tests")
    print("=" * 50)
    
    tester = SonarAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("User Registration", tester.test_register_user),
        ("Get Current User", tester.test_get_current_user),
        ("Create Project", tester.test_create_project),
        ("Get Projects", tester.test_get_projects),
        ("Get Project", tester.test_get_project),
        ("Update Project", tester.test_update_project),
        ("VS Code Pre-Provision", tester.test_vscode_provision_endpoint),
        ("VS Code Provision Status", tester.test_vscode_provision_status),
        ("Attach Provision to Project", tester.test_attach_provision_to_project),
        ("VS Code Codebase Creation", tester.test_codebase_creation_endpoint),
        ("Delete Project", tester.test_delete_project),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())