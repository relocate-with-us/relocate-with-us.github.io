import requests
from bs4 import BeautifulSoup
import os

def fetch_job_descriptions(url):
    # Send a GET request to the website
    response = requests.get(url)
    
    # Check if the request was successful
    if response.status_code != 200:
        print(f"Failed to retrieve page with status code: {response.status_code}")
        return

    # Parse the HTML content of the page
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the section with job listings
    jobs_section = soup.find('section', id='jobs')

    # Check if the jobs section was found
    if not jobs_section:
        print("Jobs section not found on the page")
        return

    # Find all job links within the jobs section
    job_links = jobs_section.find_all('a', href=True)

    # Iterate through each job link and fetch the job description
    for job_link in job_links:
        job_url = job_link['href']
        fetch_and_store_job_description(job_url)

def fetch_and_store_job_description(job_url):
    # Send a GET request to the job details page
    response = requests.get(job_url)
    
    # Check if the request was successful
    if response.status_code != 200:
        print(f"Failed to retrieve job page with status code: {response.status_code}")
        return

    # Parse the HTML content of the job page
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the job title
    job_title = soup.find('h1').get_text(strip=True) if soup.find('h1') else 'Job Title Not Found'

    # Find the job description container
    job_description = soup.find('div', class_='job-description')

    # Check if the job description was found
    if not job_description:
        print(f"Job description not found for URL: {job_url}")
        return

    # Get the job description text
    job_description_text = job_description.get_text(strip=True)

    # Store the job title and description in a text file
    store_job_description(job_title, job_description_text)

def store_job_description(job_title, job_description):
    # Create a valid file name from the job title
    valid_file_name = "".join(x for x in job_title if x.isalnum() or x in "._- ").strip()
    file_name = f"{valid_file_name}.txt"
    
    # Ensure the directory exists
    os.makedirs('job_descriptions', exist_ok=True)
    
    # Write the job description to a text file
    with open(os.path.join('job_descriptions', file_name), 'w', encoding='utf-8') as file:
        file.write(f"Job Title: {job_title}\n\n")
        file.write(f"Job Description:\n{job_description}\n")

if __name__ == "__main__":
    monzo_careers_url = 'https://monzo.com/careers#jobs'
    fetch_job_descriptions(monzo_careers_url)
