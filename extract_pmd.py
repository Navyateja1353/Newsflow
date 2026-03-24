import sys
import string
import re

def extract_strings(filename, min_length=4):
    with open(filename, 'rb') as f:
        data = f.read()

    # Find ASCII strings
    ascii_pattern = b"[%b]{%d,}" % (string.printable.encode('ascii'), min_length)
    ascii_strings = [m.decode('ascii', errors='ignore').strip() for m in re.findall(ascii_pattern, data)]

    # Also try utf-16le just in case Adobe used it
    utf16_pattern = b"(?:[%b]\x00){%d,}" % (string.printable.encode('ascii'), min_length)
    utf16_strings = []
    for match in re.findall(utf16_pattern, data):
        try:
            utf16_strings.append(match.decode('utf-16le', errors='ignore').strip())
        except:
            pass
            
    all_strings = ascii_strings + utf16_strings
    
    # Filter out empty or mostly symbol strings to keep it clean
    filtered = []
    for s in all_strings:
        if len(s) >= min_length and any(c.isalpha() for c in s):
            filtered.append(s)
            
    return filtered

if __name__ == '__main__':
    filename = sys.argv[1]
    strings = extract_strings(filename)
    
    with open('pmd_extracted_strings.txt', 'w', encoding='utf-8') as out:
        for s in strings:
            out.write(f"{s}\n")
    print(f"Extracted {len(strings)} strings to pmd_extracted_strings.txt")
