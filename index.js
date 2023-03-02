function fetchJobs() {
    fetch("https://relocate-with-us.github.io/db.json")
        .then(res => res.json())
        .then(data => {
            const jobsList = document.getElementById("jobsList");
            jobsList.innerHTML = "";
            data.forEach((job, index) => {
                // calculate the number of days since the job was posted

                //const postedDate = moment(job.post_date, "YYYY-MM-DD");

                // calculate the number of days since the job was posted
                // const postedDaysAgo = moment().diff(postedDate, "days");

                jobsList.innerHTML += `
                <a href="${job.description}" class="flex bg-white shadow-md my-16 mx-10 p-6 rounded border-l-4 border-teal-500 border-solid
                sm: flex-row sm: my-10">
                    <div class=" flex justify-between">
                        <img  src=${job.logo}
                        class="-mt-16 mb-4 w-16 h-16 sm:w-28 sm:h-24 sm:mt-0 sm:my-0 object-contain"
                        alt="${job.company}" />
                    </div>
                        <div class="flex flex-col justify-between ml-6">
                          <h3 class="font-bold text-base text-teal-500 mb-1">
                          ${job.company}
                          <span class="ml-2 bg-teal-500 text-sm text-teal-100 p-1 px-2 rounded-full uppercase">${job.isNew}</span>
                          <span class="ml-2 bg-gray-600 text-sm text-white p-1 pr-2 px-2 rounded-full uppercase">${job.visa}</span>
                          </h3>
                          <h2 class="font-bold text-xl my-2 sm:my-0">${job.position}</h2>
                          <p class="text-gray-700">
                          ${job.contract} · ${job.location} 
                          </p>
                          <h2 class="text-gray-700">Posted ${job.post_date}</h2>
                          
                        </div>
                        
                        <div class="flex justify-end">
                </div>
                <div class="ml-auto">
                    <button onclick="location.href='${job.description}'" type="button" class="hover:bg-blue-500 text-black-300 rounded bg-blue-300 py-2 px-3  transition duration-300">Apply
                    <svg class="inline-block" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-external-link" width="20" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                        <path d="M10 14l10 -10"></path>
                        <path d="M15 4l5 0l0 5"></path>
                    </svg>
                    </button>
                </div>
                
            </div>
              </>
                `
            });
        })
        .catch(error => console.error(error));
}"></path>
                    </svg>
                    </button>
                </div>
                
            </div>
              </>
                `
            });
        })
        .catch(error => console.error(error));
}
