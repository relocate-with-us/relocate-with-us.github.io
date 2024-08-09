import json

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def is_german_company(job):
    return "Germany" in job.get("location", "")

def format_as_markdown_table(german_companies):
    if not german_companies:
        return "No companies found in Germany."

    markdown = "| Company |\n"
    markdown += "| --- |\n"

    for company in german_companies:
        markdown += f"| {company} |\n"

    return markdown

def write_to_file(content, file_path):
    with open(file_path, 'w') as file:
        file.write(content)

def main():
    input_file_path = "db.json"
    output_file_path = "german_companies.txt"
    
    data = read_json_file(input_file_path)
    
    german_companies = set(job["company"] for job in data if is_german_company(job))
    
    markdown_table = format_as_markdown_table(sorted(german_companies))
    
    write_to_file(markdown_table, output_file_path)
    print(f"Results have been written to {output_file_path}")

if __name__ == "__main__":
    main()