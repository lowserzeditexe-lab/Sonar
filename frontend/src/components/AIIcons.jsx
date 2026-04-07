// Real AI model icons using uploaded brand images

const CLAUDE_URL  = "https://customer-assets.emergentagent.com/job_sonar-preferences/artifacts/n8dx7aam_image.png";
const CHATGPT_URL = "https://customer-assets.emergentagent.com/job_emergent-mock-2/artifacts/lgeh51by_image.png";
const GEMINI_URL  = "https://customer-assets.emergentagent.com/job_emergent-mock-2/artifacts/5vls8viv_image.png";

export function ChatGPTIcon({ size = 16 }) {
  return (
    <img
      src={CHATGPT_URL}
      alt="ChatGPT"
      width={size}
      height={size}
      style={{ borderRadius: "3px", objectFit: "contain", flexShrink: 0 }}
    />
  );
}

export function ClaudeIcon({ size = 16 }) {
  return (
    <img
      src={CLAUDE_URL}
      alt="Claude"
      width={size}
      height={size}
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  );
}

export function GeminiIcon({ size = 16 }) {
  return (
    <img
      src={GEMINI_URL}
      alt="Gemini"
      width={size}
      height={size}
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  );
}
