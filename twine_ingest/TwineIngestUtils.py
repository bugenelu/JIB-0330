import re


# prepends an import ID# to a string with a '-' delimiter
def prepend_id(import_id, string_to_prepend):
    return str(import_id) + '-' + string_to_prepend


# deletes returns at the end of a string
def delete_end_returns(s):
    while s[-2:-1] == "\n":
        s = s[0:-2]
    return s


# makes a page node from tw-passage tag contents
def make_page_node(passage, import_id, id_dict):
    page_id = prepend_id(import_id, passage.attrs['pid'])
    page_name = prepend_id(import_id, passage.attrs['name'])
    page_node = {'page-ID': page_id, 'page-name': page_name}
    body = passage.get_text()
    page_node['page-body-text'] = delete_end_returns(body[0:body.find("[[")])
    children = re.findall('\[\[(.*?)\]\]', body)
    page_node['page-children'] = make_child_dict(children, import_id, id_dict)
    return page_node


# makes a dictionary of the passage's child nodes
def make_child_dict(children, import_id, id_dict):
    child_dict = {}
    for child in children:
        page_name = prepend_id(import_id, child[child.find("->") + 2:])
        link_text = child[0: child.find("->")]
        page_id = id_dict[child[child.find("->") + 2:]]
        child_dict[page_id] = {"child-name": page_name, "link-text": delete_end_returns(link_text), "child-ID": page_id}
    return child_dict


# makes a dictionary of ['name' : 'pid'] k-v pairs. PID's are prepended with the import ID#
def make_id_dict(passages, import_id):
    id_dict = {}
    for passage in passages:
        id_dict[passage.attrs['name']] = prepend_id(import_id, passage.attrs['pid'])
    return id_dict


