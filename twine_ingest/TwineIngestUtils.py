import re


def prepend_id(import_id, string_to_prepend):
    return str(import_id) + '-' + string_to_prepend


def delete_end_returns(s):
    while s[-2:-1] == "\n":
        s = s[0:-2]
    return s


def make_page_node(passage, import_id, id_dict):
    page_id = prepend_id(import_id, passage.attrs['pid'])
    page_name = prepend_id(import_id, passage.attrs['name'])
    page_node = {'page-ID': page_id, 'page-name': page_name}
    body = passage.get_text()
    page_node['page-body-text'] = delete_end_returns(body[0:body.find("[[")])
    children = re.findall('\[\[(.*?)\]\]', body)
    page_node['page-children'] = make_child_dict(children, import_id, id_dict)
    return page_node


def make_child_dict(children, import_id, id_dict):
    child_dict = {}
    for child in children:
        page_name = prepend_id(import_id, child[child.find("->") + 2:])
        link_text = child[0: child.find("->")]
        page_id = id_dict[child[child.find("->") + 2:]]
        child_dict[page_id] = {"child-name": page_name, "link-text": link_text, "child-ID": page_id}
    return child_dict


def make_id_dict(passages, import_id):
    id_dict = {}
    for passage in passages:
        id_dict[passage.attrs['name']] = prepend_id(import_id, passage.attrs['pid'])
    return id_dict


