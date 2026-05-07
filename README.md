# HOT: Learning Generalizable Hand-Object Tracking without Human Demonstration

## Page Teaser

This work learns generalizable hand-object tracking controllers purely from synthetic data.  
HOG synthesizes diverse hand-object trajectories, and HOT tracks them robustly across objects, long-horizon sequences, and different dexterous hands.

## Abstract

We present a system for learning generalizable hand-object tracking controllers purely from synthetic data, without requiring any human demonstrations.

Our approach makes two key contributions:
(1) **HOG**, a highly efficient Hand-Object data generator that rapidly synthesizes **diverse, large-scale**, and **uniformly distributed trajectories**; and
(2) **HOT**, a Hand-Object Tracker that bridges **synthetic-to-physical** transfer through reinforcement learning and interaction imitation learning.
Notably, we demonstrate that the fast and intentionally noisy data generation process of HOG is crucial for endowing HOT with robust interaction dynamics.

Our method extends to **diverse object shapes** and **hand morphologies**.
Through extensive evaluations, we show that our approach enables dexterous hands to track challenging, long-horizon sequences including object re-arrangement and agile in-hand reorientation.
These results represent a significant step toward scalable foundation controllers for manipulation that can learn entirely from simple, scalable synthetic data, breaking the data bottleneck that has long constrained progress in dexterous manipulation.
