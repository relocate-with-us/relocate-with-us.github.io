import { db } from 'src/data/db';
import type { JobPost } from '../types/JobPost';
import { renderJobListItem } from './renderJobListItem';

// keep track of loaded jobs
const loadedJobs: JobPost['position'][] = [];

export function fetchDefaultJobs() {
  const start = 0;
  const limit = 10;
  fetchJobs(start, limit, null, defaultJobs);
}

export function fetchJobs(
  start: number,
  limit: number,
  filter: ((data: JobPost) => void) | null,
  callback: (data: JobPost[]) => void
) {
  try {
    const filteredData = filter ? db.filter(filter) : db;
    const slicedData = filteredData.slice(start, start + limit);
    callback(slicedData);
  } catch (error) {
    console.log(error);
  }
}

export function defaultJobs(data: JobPost[]) {
  const jobsList = document.getElementById('jobsList') as HTMLUListElement;
  data.forEach((job) => {
    // check if job is already loaded
    if (!loadedJobs.includes(job.position)) {
      jobsList.innerHTML += renderJobListItem(job);
      loadedJobs.push(job.position);
    }
  });
}

export function filterJobs(text: string) {
  const start = 0;
  const limit = 10;
  fetchJobs(
    start,
    limit,
    (job) => {
      const query = String(text).toLowerCase();
      const position = String(job.position).toLowerCase();
      return position.includes(query);
    },
    (data) => {
      const jobsList = document.getElementById('jobsList') as HTMLUListElement;
      jobsList.innerHTML = '';
      loadedJobs.length = 0;

      data.forEach((job) => {
        // check if job is already loaded
        if (!loadedJobs.includes(job.position)) {
          jobsList.innerHTML += renderJobListItem(job);
          loadedJobs.push(job.position);
        }
      });
    }
  );
}
