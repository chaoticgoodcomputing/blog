---
title: Hello, Blog!
date: 2021-07-28
tags:
  - data
  - "#engineering/python"
  - articles
---

Look at that - a whole blog, just for me! At this rate, the last thing I need to do to be a *real* tech guru is start a podcast.

I'm starting this page as a place to talk about my cool projects, dumb thoughts, and other odds-and-ends aspects about my life and work.

To set the tone, here's a quick code function to find [the geomethic meandian](https://xkcd.com/2435/) of a set of numbers in Python - in case the need ever arises.

![](https://imgs.xkcd.com/comics/geothmetic_meandian.png)

```py
import numpy as np

def geothmetic_meandian(
    numbers: np.array,
    error: float = 10e-5
):
    '''Find the geothmetic meandian of a set of numbers.'''

    # If all the numbers are close to the same, return the first number
    if sum(np.abs(numbers - numbers[0])) < error:
        return numbers[0]
    else:
        # Recursively call the geomethic meandian until the numbers converge
        return geothmetic_meandian(np.array([
            np.average(numbers),
            np.product(np.power(numbers, 1 / len(numbers))),
            np.median(numbers)
        ]), error)
```

```
>>> geothmetic_meandian([1, 1, 2, 3, 5])
2.089
```

Voila!
