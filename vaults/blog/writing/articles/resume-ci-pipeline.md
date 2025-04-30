---
title: Job Applications are a Waking Nightmare - Let Tech Do It For You
date: 2021-07-29
tags:
  - mentoring/tutorials
  - engineering/devops
  - articles
---
> NOTE: THIS IS OUTDATED. There are now *far* better PDF markup languages to use, such as [Typst](https://typst.app). These will be detailed in a later blog post.

After trying - and failing - to *constantly* keep my resume up-to-date in a dozen different places, I took a page out of the wild world of software development and found the solution: **continuous integration.**

It used to be the case that software would release in massive updates. A bunch of big changes, tweaks, and bug fixes would be shoved together in a tidy package and delivered out all at once. As development became faster, though, development teams created **continuous integration** pipelines to constantly push changes out to their users. Rather than waiting until the next big change to release patches, small changes could be pushed out automatically.

This is common in web applications like Facebook or Twitter. You'll never see Twitter come out with some big new Twitter 2.0 (*Two-tter*) - any changes they need to make are just pushed out to users in small batches, over time. Why not do the same with a resume?

## Creating an Always-Updated Resume

Creating a continuously-updating resume can be done in two steps:

1. Set up your resume so that you can make small, quick, iterative changes over time; and
2. Find a central place to send those changes to, and send viewers to that location.

I'm sure there are quite a few ways to run those two stages. I personally chose [Overleaf](https://overleaf.com) and [GitHub](https://github.com). At this point, I had already been using Overleaf to [format my resume](#) and had been using GitHub for small odds-and-ends projects for the first couple years of my undergrad. If we're being honest, I didn't want to learn new things - I just wanted it to work.

Sometimes being lazy pays off. Not *usually,* but *sometimes.*

It also helps that [Overleaf has a neat built-in GitHub integration](#). How nice of them to do that! With this integration, the steps for the project start to come together:

1. Create a resume on Overleaf
2. Push your resume to GitHub
3. Compile your resume into a `.pdf` file

Alright - let's do it!

### Creating a Resume in Overleaf

For the uninitiated, Overleaf is an application commonly used in academia to write academic papers in a programming language called LaTeX. If you've ever used HTML to create a website, LaTeX does the same thing for PDFs. Thankfully, to get started, you don't have to create a new resume from scratch. Overleaf has [a ton of sleek-looking resume templates](https://www.overleaf.com/gallery/tagged/cv) that you can put your current information into. If you're looking for a friendly resume-making guide, [I made a starter template](https://www.overleaf.com/read/dpkcngtfrygt) with explanations on a few best resume practices for students.

Once you have a template picked, you can select **"Open as Template"** to add it to your personal Overleaf projects. You can start putting your information in at your own pace, but it isn't necessary to start connecting your resume to GitHub.

### Linking Overleaf and GitHub

If you don't have a GitHub account, now is the time to [make a new one](https://github.com/join)! GitHub is a fantastic place to store and update code - it's literally what it was made for! Because your new resume (and the LaTeX it's made from) are very small, it's an ideal place to host your resume.

On your Overleaf resume, you can find the GitHub integration in the menu on the top-left of the code editing window. After signing into your GitHub account, you'll have the option to create a new code repository for your project. Choose a name for your repository, enter a description if you'd like, and then select the option to make your repository public.

While you can name your code repository anything, I would recommend sending this to your user's [GitHub Pages](https://pages.github.com/) repository. Every GitHub user gets a special place where they can host a website or files publicly at `<YOUR USERNAME>.github.io`. If that type of address looks familiar, it's because I host this blog on my own GitHub Pages site!

In order to use Github Pages, you'll need to name your new repository `<YOUR USERNAME>.github.io`. For example, because my GitHub username is `spelkington`, my GitHub Pages repository is named `spelkington.github.io`.

Finally, with your repository made, click the button to **push Overleaf changes to GitHub.** Now it's time to make your resume update automatically!

### Setting up Continuous Integration

GitHub has a nifty feature called [Github Actions](https://github.com/features/actions) that development teams can use to automate some of the pain-in-the-ass aspects of programming. Typically this involves automatically testing software for glitches or compiling code, but for our case we're going to use it to automatically turn our resume code into a `.pdf` file.

Thankfully, we don't have to come up with a way to do this ourselves! Xu Cheng has created a nifty [GitHub Action](https://github.com/marketplace/actions/github-action-for-latex) that will compile LaTeX files into PDFs.

Go to your new repository on [GitHub](https://github.com) and click on the **Actions** button at the top. From there, you can **create a new action.**

Creating a new action should take you to a code editor where you can create an Action configuration from scratch. Remove everything and place this code below:

```yaml
name: Build LaTeX document

# Run this action every time the resume .tex is updated
on:
  push:
    paths:
      - '<RESUME FILE NAME>.tex'

jobs:
  build_latex:
    runs-on: ubuntu-latest
    steps:

 # Check out the repository on the Action machine
      - name: Set up Git repository
        uses: actions/checkout@v2

 # Compile the LaTeX document into a .pdf
      - name: Compile LaTeX document
        uses: xu-cheng/latex-action@v2
        with:
          root_file: resume/<RESUME FILE NAME>.tex
 
 # Commit this change as an automated user
      - name: Commit Change
        uses: EndBug/add-and-commit@v7.0.0
        with:
          author_name: <YOUR NAME> (auto)
          author_email: <YOUR EMAIL>
          message: 'TeX compile'
 
 # Push the change to the repository
      - name: Upload PDF
        uses: ad-m/github-push-action@master
        with:
          github_token: $\{{ secrets.GITHUB_TOKEN }}
```

Replace everything in the `< >` brackets, press the **"Start Commit"** button at the top right, and you're all set! From now on, whenever you make changes to your resume in Overleaf, you can navigate back to the GitHub integration menu, push your change, and it'll automatically send the code to GitHub and turn it into a .PDF!

### Sending Your Resume

Of course, the point of all this is be able to have a single link to your resume that will stay up-to-date forever. So how do we get this link?

If you followed the instructions for setting up the resume on your GitHub pages repository, it's easy! Your resume will be available at `<YOUR GITHUB USERNAME>.github.io/<YOUR RESUME FILE>.pdf`. For example, mine is available at [spelkington.github.io/Elkington_Resume.pdf](https://spelkington.github.io/Elkington_Resume.pdf).
