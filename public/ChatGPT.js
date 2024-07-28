

const OPENAI_API_KEY = "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"; // Replace with your actual API key

async function chatGPT(prompt) {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => data.choices[0].message.content)
    .catch(error => {
        console.error('Error in ChatGPT API:', error);
        throw error;
    });
}