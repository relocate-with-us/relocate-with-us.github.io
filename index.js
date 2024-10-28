// list of html elements
const jobsList = document.getElementById("jobsList");

// keep track of loaded jobs
const loadedJobs = [];

function fetchDefaultJobs() {
    const start = 0;
    const limit = 10;

    fetchJobs(start, limit, null, defaultJobs);
}

function fetchJobs(start, limit, filter, callback) {
    fetch("./db.json")
        .then(res => res.json())
        .then(data => {
            const filteredData = filter ? data.filter(filter) : data;
            const slicedData = filteredData.slice(start, start + limit);
            callback(slicedData);
        })
        .catch(error => console.error(error));
}

function defaultJobs(data) {
        data.forEach((job, index) => {
            // check if job is already loaded
            if (!loadedJobs.includes(job.position)) {
                jobsList.innerHTML += generateJobElement(job, index);
                loadedJobs.push(job.position);
            }
        });
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        
        const start = jobsList.children.length;
        const limit = 10; // Load 10 items at a time
        fetchJobs(start, limit, null, (data) => {
            defaultJobs(data);
        });
    }
});

function filterJobs(text) {
    const start = 0;
    const limit = 10;

    fetchJobs(start, limit, (job) => {
        const query = String(text).toLowerCase();
        const position = String(job.position).toLowerCase();
        return position.includes(query);
    }, (data) => {
        jobsList.innerHTML = "";
        loadedJobs.length = 0;

        data.forEach((job, index) => {
            // check if job is already loaded
            if (!loadedJobs.includes(job.position)) {
                jobsList.innerHTML += generateJobElement(job, index);
                loadedJobs.push(job.position);
            }
        });
    });
}

function toggleDescription(index) {
    const descriptionElement = document.getElementById(`job-description-${index}`);
    const isVisible = descriptionElement.style.display === "block";
    descriptionElement.style.display = isVisible ? "none" : "block";
}

function generateJobElement({ description, descriptions, company, logo, reloc, visa, position, contract, location, post_date, affiliate_link }, index) {
    const applyLink = affiliate_link || description;
    const applyText = affiliate_link ? "Generate" : "Apply <svg class=\"inline-block\" xmlns=\"http://www.w3.org/2000/svg\" class=\"icon icon-tabler icon-tabler-external-link\" width=\"20\" height=\"16\" viewBox=\"0 0 24 24\" stroke-width=\"2\" stroke=\"currentColor\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"></path><path d=\"M10 14l10 -10\"></path><path d=\"M15 4l5 0l0 5\"></path></svg>";

    // Format post date for display
    const postDate = new Date(post_date);
    const currentDate = new Date();
    const timeDiff = currentDate - postDate; // Time difference in milliseconds
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds

    // If job posted within the last 24 hours, show "New", otherwise show the actual date
    let dateBadge = "";
    if (timeDiff < oneDay) {
        dateBadge = `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">New</span>`;
    } else {
        const formattedDate = postDate.toLocaleDateString(); // Format date as MM/DD/YYYY or local format
        dateBadge = `<span class="text-gray-500 text-sm">Posted: ${formattedDate}</span>`;
    }

    const visaBadge = visa ? `<span class="badge bg-green-200 text-green-800 mr-2">${visa}</span>` : '';
    const relocBadge = reloc ? `<span class="badge bg-yellow-200 text-yellow-800">${reloc}</span>` : '';

    return `
        <div class="job-listing relative shadow-md my-4 p-4 rounded border-l-4 border-teal-500 border-solid hover:shadow-lg" style="max-width: 700px; transition: box-shadow 0.3s ease;">
            <div class="flex justify-between items-center">
                <div class="flex">
                    <div class="flex-shrink-0 mr-4">
                        <img src=${logo} loading=lazy class="w-16 h-16 object-contain" alt="${company}" />
                    </div>
                    <div class="flex-grow">
                        <h2 class="font-bold text-xl">${position}</h2>
                        <div class="text-teal-500">${company}</div>
                        <div class="mt-2 text-gray-700">${contract} · ${location}</div>
                    </div>
                </div>
                <div class="text-right relative">
                    ${dateBadge}
                    <!-- Apply button hidden by default, shown on hover -->
                    <a href='${applyLink}' target='_blank'>
                        <button type="button" class="apply-button hidden absolute top-0 right-0 bg-blue-500 text-white rounded py-2 px-3 hover:bg-blue-700 transition duration-300" style="font-size: 12px; transform: translateY(-100%);">
                            Apply
                        </button>
                    </a>
                </div>
            </div>
            
            <div class="flex mt-4 items-center">
                ${visaBadge}
                ${relocBadge}
            </div>

            <div id="job-description-${index}" class="job-description hidden mt-4 p-4 bg-gray-100 border-t border-gray-300" style="display: none;">
                <p><strong>Job Description:</strong> ${descriptions}</p>
                <a href="${applyLink}" class="text-blue-500 hover:text-blue-700 transition">Apply here</a>
            </div>
        </div>
    `;
}


