"""
Examples of a function that returns functions in Python. This is one way to handle passing UI input
on what to do to a story graph through the Editor to the specified StoryGraph.

bonus: using f'{var}' to parameterize strings
"""


def shopFor(item=None):
    if item is not None:
        print(f'You bought a {item} and it was a wise purchase.')
    else:
        print('You saved your money.')
    return None


def functionFactory(functionID):
    if functionID == 1:
        # lambda 1 param
        return lambda name: f'You have a name and it is {name}'
    elif functionID == 2:
        # lambda 2 param
        return lambda fruit, vegetable: f'You got some {fruit} and some {vegetable} to eat.'
    elif functionID == 3:
        # function defined outside of functionFactory method
        return shopFor
    elif functionID == 4:
        # no arg lambda
        return lambda: "you get this every time"
    else:
        return None


name = input('What is your name?: ')
print(functionFactory(1)(name))

fruit = input('What\'s a fruit you like?: ')
vegetable = input('What\'s a vegetable you like?: ')
print(functionFactory(2)(fruit, vegetable))

functionFactory(3)()
thing = input('What\'s a thing to buy: ')
functionFactory(3)(thing)

f = functionFactory(4)
whatYouGet = f()
print(f'This is what you get: {whatYouGet}')
if functionFactory(5) is None:
    print('you get what you pay for')
