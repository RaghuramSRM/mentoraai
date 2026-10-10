import pdfplumber

with pdfplumber.open("tmp/project-session.pdf") as pdf:
    print("PAGES", len(pdf.pages))
    for number, page in enumerate(pdf.pages, start=1):
        print(f"--- PAGE {number} ---")
        print(page.extract_text() or "")
