## MF's first silly attempt at doing this all on his own.

ingest_file = open("demo-story.html")
this_char = ''
while this_char != '<':
    this_char = ingest_file.read(1)
tag = this_char
while this_char != '>':
    this_char = ingest_file.read(1)
    tag += this_char
ingest_file.close()
print(tag)

