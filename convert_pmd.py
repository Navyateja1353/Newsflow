import requests
import sys
import os

def convert_pmd_to_pdf(filepath):
    url = "https://s2.aconvert.com/convert/api-win.php"
    
    files = {'file': open(filepath, 'rb')}
    data = {
        'targetformat': 'pdf',
        'code': '81009' # usually their free API doesn't strictly need a complex auth code or it's public for tiny files, let's try.
    }
    
    print(f"Uploading {filepath} to aconvert.com...")
    try:
        response = requests.post(url, files=files, data=data, timeout=60)
        result = response.json()
        
        if result.get("state") == "SUCCESS":
            download_url = result.get("filename")
            print(f"Success! Downloading PDF from {download_url}...")
            
            pdf_resp = requests.get(download_url)
            out_name = os.path.basename(filepath).replace('.pmd', '.pdf')
            with open(out_name, 'wb') as f:
                f.write(pdf_resp.content)
            print(f"Saved to {out_name}")
        else:
            print("Conversion failed:", result)
            
    except Exception as e:
        print("Error during conversion:", e)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        convert_pmd_to_pdf(sys.argv[1])
    else:
        print("Provide a file path")
