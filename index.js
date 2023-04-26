function fetchDefaultJobs() {
    fetchJobs(defaultJobs)
}

function fetchJobs(start, limit, callback) {
    fetch("./db.json")
        .then(res => res.json())
        .then(data => callback(data.slice(start, start + limit)))
        .catch(error => console.error(error));
}


function defaultJobs(data) {
    const jobsList = document.getElementById("jobsList");
    data.forEach((job, index) => {
        jobsList.innerHTML += generateJobElement(job);
    });
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        const jobsList = document.getElementById("jobsList");
        const start = jobsList.children.length;
        const limit = 10; // Load 10 items at a time
        fetchJobs(start, limit, (data) => {
            defaultJobs(data);
        });
    }
});

function filterJobs(text, start, limit) {
  fetchJobs(start, limit, (data) => {
    const jobsList = document.getElementById("jobsList");
    jobsList.innerHTML = "";

    data.forEach((job, index) => {
      const query = String(text).toLowerCase();
      const position = String(job.position).toLowerCase();

      if (position.includes(query)) {
        jobsList.innerHTML += generateJobElement(job);
      }
    });
  });
}

function generateJobElement({ description, company, logo, reloc, visa, position, contract, location, post_date }) {
        return `
          <a href="${description}" class="flex bg-white shadow-md my-6 mx-2 p-3 rounded border-l-4 border-teal-500 border-solid">
            <div class="flex-shrink-0 mr-4">
              <img src=${logo} loading=lazy class="w-16 h-16 object-contain" alt="${company}" />
            </div>
            <div class="flex-grow">
              <div class="flex items-center justify-between">
                <h2 class="font-bold text-xl">${position}</h2>
                <div class="flex items-center">
                  <div class="mt-2 text-gray-700 hidden md:block">${post_date}</div>
                  <button onclick="location.href='${description}'" type="button" class="hidden md:block bg-blue-500 text-white rounded py-2 px-3 hover:bg-blue-700 transition duration-300 ml-2">Apply<svg class="inline-block" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-external-link" width="20" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                  <path d="M10 14l10 -10"></path>
                  <path d="M15 4l5 0l0 5"></path>
              </svg>
                  </button>
                </div>
              </div>
              <div class="mt-2 text-teal-500">${company}</div>
              <div class="flex items-center flex-wrap mt-2">
                ${reloc && `<div class="mr-2 mb-2 md:mb-0 bg-teal-500 text-sm text-teal-100 p-1 px-2 rounded-full uppercase">${reloc}</div>`}
                ${visa && `<div class="mr-2 mb-2 md:mb-0 bg-purple-500 text-sm text-purple-100 p-1 px-2 rounded-full uppercase">${visa}</div>`}
              </div>
              <div class="mt-2 text-gray-700">${contract} · ${location}</div>
              <button onclick="location.href='${description}'" type="button" class="md:hidden block mt-2 bg-blue-500 text-white rounded py-2 px-3 hover:bg-blue-700 transition duration-300 w-full">Apply<svg class="inline-block" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-external-link" width="20" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
              <path d="M10 14l10 -10"></path>
              <path d="M15 4l5 0l0 5"></path>
          </svg>
          </button>
              <div class="text-gray-700 mt-2 md:hidden">Posted: ${post_date}</div>
            </div>
          </a>
        `;
      }
