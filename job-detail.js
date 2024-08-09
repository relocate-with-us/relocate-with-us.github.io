document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if (jobId) {
        fetchJobDetails(jobId);
    } else {
        document.getElementById('job-detail').innerHTML = '<p>Job not found.</p>';
    }
});

function fetchJobDetails(jobId) {
    fetch("./db.json")
        .then(res => res.json())
        .then(data => {
            const job = data.find(job => job.position === jobId);
            if (job) {
                displayJobDetails(job);
            } else {
                document.getElementById('job-detail').innerHTML = '<p>Job not found.</p>';
            }
        })
        .catch(error => console.error(error));
}

function displayJobDetails(job) {
    const jobDetailElement = document.getElementById('job-detail');
    jobDetailElement.innerHTML = `
        <h1 class="text-3xl font-bold mb-4">${job.position}</h1>
        <div class="mb-4">
            <img src="${job.logo}" alt="${job.company}" class="w-32 h-32 object-contain mb-2">
            <h2 class="text-xl font-semibold">${job.company}</h2>
        </div>
        <div class="mb-4">
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Contract:</strong> ${job.contract}</p>
            <p><strong>Posted:</strong> ${job.post_date}</p>
        </div>
        <div class="mb-4">
            ${job.reloc ? `<span class="bg-teal-500 text-white px-2 py-1 rounded mr-2">${job.reloc}</span>` : ''}
            ${job.visa ? `<span class="bg-purple-500 text-white px-2 py-1 rounded">${job.visa}</span>` : ''}
        </div>
        <div class="mb-4">
            <h3 class="text-xl font-semibold mb-2">Job Description</h3>
            <p>For more details about this position, please visit the company's job listing.</p>
        </div>
        <a href="${job.description}" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">Apply Now</a>
    `;
}