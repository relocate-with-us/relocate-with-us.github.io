function fetchJobs() {
    fetch("db.json")
        .then(res => res.json())
        .then(data => {
            const jobsList = document.getElementById("jobsList");
            jobsList.innerHTML = "";
            data.forEach((job, index) => {
                jobsList.innerHTML += `
                <a href="" class="flex bg-white shadow-md my-16 mx-10 p-6 rounded border-l-4 border-teal-500 border-solid
                sm: flex-row sm: my-10">
                    <div class="flex">
                        <img  src=${job.logo}
                        class="-mt-16 mb-4 w-16 h-16 sm:w-28 sm:h-24 sm:mt-0 sm:my-0 object-contain"
                        alt="${job.company}" />
                    </div>
                        <div class="flex flex-col justify-between ml-6">
                          <h3 class="font-bold text-base text-teal-500 mb-1">
                          ${job.company}
                          <span class="ml-2 bg-teal-500 text-sm text-teal-100 p-1 px-2 rounded-full uppercase">New</span>
                          <span class="ml-2 bg-gray-600 text-sm text-white p-1 pr-2 px-2 rounded-full uppercase">Featured</span>
                          </h3>
                          <h2 class="font-bold text-xl my-2 sm:my-0">${job.position}</h2>
                          <p class="text-gray-700">
                          ${job.post_date} · ${job.contract} · ${job.location}
                          </p>
                        </div>
                        <div class="flex justify-end">
                </div>
                <div class="ml-auto">
                    <button href="#" class="hover:bg-blue-500 rounded text-black-300 bg-blue-300 py-2 px-3  transition duration-300">Apply</button>
                </div>
              
            </div>
              </>
                `
            });
        })
        .catch(error => console.error(error));
}