Role
You are an expert JavaScript developer who writes clean, minimal code for GitHub Pages. Follow every requirement exactly—no extra libraries, comments, or text.

Context
• Static site only (index.html + app.js)
• Data file: reviews_test.tsv (has a text column)
• Papa Parse via CDN must load & parse TSV.
• One optional input field for Hugging Face API token.
• Use ONE model endpoint: https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3

– task = text-generation
– Request body:

{
  "inputs": PROMPT,
  "parameters": { "max_new_tokens": 8, "temperature": 0, "return_full_text": false },
  "options": { "wait_for_model": true }
}


– Headers:
Content-Type: application/json
Authorization: Bearer <token> only if the token field is not empty; do not send this header when empty.
• HF response format: JSON array with generated_text; use the first element’s generated_text.
• UI buttons

Select Random Review → show random review text.

Analyze Sentiment → POST with prompt:
Return only one word in lowercase on the first line: positive, negative, or neutral. Classify this review: + text

Count Nouns → POST with prompt:
Return only one word in lowercase on the first line: high (if >15 nouns), medium (6-15), or low (<6). Count the nouns in this review and output only the level word: + text.
• Parse model response by taking the first line, trimming, and lowercasing it.
• Display:
– Sentiment: 👍 / 👎 / ❓
– Noun count level: 🟢(high) / 🟡(medium) / 🔴(low)
• Handle loading spinner, API errors (402/429), and rate-limit messages; reset UI gracefully.
• All logic in vanilla JS (fetch, async/await).
• No server-side code.

Samples from reviews_test.tsv
sentiment productId userId summary text helpfulY helpfulN
1 B001E5DZTS A3SFPP61PJY61S Not so goaty- which is Good! Wonderful product! I began to use it for my daughter who was about to turn a year old. She took it with no problems! It was recommended by a friend who also used it when she too had to stop breastfeeding. Much better for a child in my eyes. I had tried a formula sample I had received in the mail- it left a greasy film in the bottle... gross. This does not! My daughter will drink it warm or cold- so easy for on the go as well. The canned was a bit harsh and she wasn't into it.. it tastes like a goat smells- this just has a suttle hint of goat. LoL 0 0
1 B002JX7GVM A3KNE6IZQU0MJV O.N.E. Coconut Water! I got the O.N.E. Coconut Water w/splash of Pineapple & it's delicious & not the least bit sweet. Just very refreshing!! LOVE IT and will continue using it. Saw this on Dr. Oz as he recommended it. 1 0

Instruction
Generate the complete code for “Review Analyzer”:

index.html
– Responsive UI with minimal CSS.
– Token input, three buttons, result card, error div, spinner.
– Link Font Awesome 6.4 CDN and Papa Parse 5.4.1 CDN.

app.js
– TSV fetch + Papa Parse → reviews array.
– Event handlers for each button.
– Shared callApi(prompt) function that POSTs to the Mistral endpoint; include Authorization: Bearer <token> only if token input is non-empty.
– Parse response as JSON → array → first element’s generated_text; take the first line for logic.
– Sentiment logic:

if (line.includes("positive")) return "👍";
if (line.includes("negative")) return "👎";
if (line.includes("neutral"))  return "❓";
return "❓";


– Noun-level logic:

if (line.startsWith("high"))   return "🟢";
if (line.startsWith("medium")) return "🟡";
if (line.startsWith("low"))    return "🔴";
return "🔴";


– Graceful error handling & UI reset (show 402/429 messages, hide spinner on finally).

Output Format

A single code block containing the full index.html.

A single code block containing the full app.js.
No prose, no explanations, no extra files.
