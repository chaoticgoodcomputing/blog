---
title: 'From the Archive: "Reading the Room with Beethoven"'
date: 2019-08-01
tags:
  - engineering/typescript
  - notes
---
Beethoven was a project for [HackTheU 2019](https://hacktheu-2019.devpost.com/), where a team and I (mostly the team) created an application for providing live captions to deaf students by using a remote microphone to stream audio and captioning to a user's local device.

From the [original submission](https://devpost.com/software/beethoven-t9ud86):

> ## Inspiration
>
> Spencer, one of our team members, has a parent who is hearing-impaired and another that provides live, remote, ver batem transcription services for deaf and hard-of-hearing undergraduate, Ph.D., and Executive MBA students across the nation. Dan and Joseph, two of our other members, work for Sorenson Communications making video calling and other applications for the deaf community. We noticed that, for deaf students who would prefer live captioning in their lectures, there is no one-stop solution for both audio streaming and live captioning. We created Beethoven, an application for quick and accurate transcription in the classroom, to solve this.
>
> ## Functionality
>
> Put simply, Beethoven will pair two devices together - an audio input and a screen output - and stream captioning from one device to the other in real time. The student can put one device at the front of the class for the clearest possible audio, and then position another next to them to read live captioning of the lecture and dialog as if it was the Closed Captioning on a television show or movie. This can either be done through Google Cloud transcription services or a live CART interpreter, depending on the level of accuracy desired and resources available.
>
> ## Development Process
>
> The application is split into three main parts - the audio input, the transcription service, and the screen output. First, the audio is captured by the audio input device. From there, it goes to either the Google Cloud voice transcriber, or a live CART interpreter. This happens through Google Cloud Services or peer-to-peer WebRTC, respectively. Once complete, the text will be sent to both our server's backend to be compiled into a transcript and send to the screen output device, placed in front of the student, where a stream of the captioning is displayed.
>
> ## What's next for Beethoven
>
> Moving forward, we'd like to fully implement the CART reporting features of the application. The P2P handshaking feature has a lot of improvements that can be made. Once finished, we'd like to reach out to the deaf and CART communities to get their feedback on the product.
