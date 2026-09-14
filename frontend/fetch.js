
async function searchPapers(query, limit, includeLLM) {
    const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            limit: limit,
            include_llm: includeLLM
        })
    });
    
    const data = await response.json()
    console.log(data)
}

async function handleFormSubmission() {
    document.getElementById('form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const query = document.getElementById('query').value;
        const limit = parseInt(document.getElementById('limit').value);
        const include_llm = document.getElementById('llm').checked;

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Searching...</p></div>';

        try {
            const response = await fetch('http://localhost:8000/search', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({query, limit, include_llm: include_llm})
            });

            const data = await response.json();

            if (response.ok) {
                displayResults(data.results, data.llm_summary);
            } else {
                displayError(data.detail);
            }
        } catch (error) {
            displayError('Network error: ' + error.message);
        }
    })
}

function displayResults(papers, llmSummary) {
    const resultsDiv = document.getElementById('results');
    let html = '';

    // Display each paper
    html += `<h2 class="text-2xl font-bold text-gray-900 mb-4">${papers.length} Results Found</h2>`;

    papers.forEach((paper, index) => {
        html += `
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition duration-200">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900 flex-1">${index + 1}. ${escapeHtml(paper.Title)}</h3>
                    <span class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        Score: ${(paper.RelevanceScore * 100).toFixed(1)}%
                    </span>
                </div>

                <div class="text-sm text-gray-600 mb-3">
                    ${paper.Year ? `<span class="mr-4">📅 ${paper.Year}</span>` : ''}
                    ${paper.CitationCount ? `<span>📚 ${paper.CitationCount} citations</span>` : ''}
                </div>

                ${paper.Abstract ? `<p class="text-gray-700 mb-3 text-sm">${escapeHtml(paper.Abstract)}</p>` : ''}

                <div class="flex gap-3">
                    ${paper.URL ? `<a href="${paper.URL}" target="_blank" class="text-blue-600 hover:underline text-sm">Read on Semantic Scholar →</a>` : ''}
                    ${llmSummary ? `<button onclick="openModal()" class="text-blue-600 hover:underline text-sm font-medium">Read AI Summary →</button>` : ''}
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;

    // Store summary for modal access
    if (llmSummary) {
        window.currentLlmSummary = llmSummary;
    }
}

function openModal() {
    document.getElementById('summaryModal').classList.remove('hidden');
    document.getElementById('summaryContent').textContent = window.currentLlmSummary;
}

function closeModal() {
    document.getElementById('summaryModal').classList.add('hidden');
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 class="text-lg font-bold text-red-900 mb-2">Error</h2>
            <p class="text-red-700">${escapeHtml(message)}</p>
        </div>
    `;
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

document.addEventListener('DOMContentLoaded', () => {
    handleFormSubmission();
});
