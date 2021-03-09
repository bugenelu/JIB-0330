import random


def roll_dice(a, b):
    num = random.randint(min(a, b), max(a, b))
    return f'You rolled {num} between {min(a, b)} and {max(a, b)}.'
