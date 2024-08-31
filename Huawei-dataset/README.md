
This is a realistic dataset released by SpeedVideo Global Operating Platform (SVGOP) established by Huawei. SVGOP is a specific application of video Mean Opinion Score (vMOS) in mobile networks throughout the world.

In particular, this dataset (.xlsx format) contains totally 89,266 samples with 16 features (i.e., Quality of Service parameters) and 1 scoring factor vMOS. 

This dataset contains various metrics related to video streaming performance. Below is a detailed description of each column:


1. **ID**: Unique identifier for each record.
2. **Initial Buffering Peak Rate (kbps)**: The peak rate of data transfer during the initial buffering phase, measured in kilobits per second.
3. **E2E RTT (ms)**: End-to-End Round-Trip Time, measured in milliseconds, indicating the time it takes for a signal to travel to the destination and back.
4. **Average Rate during Playback (kbps)**: The average rate of data transfer during the playback phase, measured in kilobits per second.
5. **Initial Buffering Delay (ms)**: The delay experienced during the initial buffering phase, measured in milliseconds.
6. **Freeze Ratio**: The ratio of time the video freezes during playback compared to the total playback time.
7. **VMOS**: Video Mean Opinion Score, a measure of video quality as perceived by users.
8. **Video Perceived Rate (kbps)**: The perceived rate of data transfer during the entire video session, measured in kilobits per second.
9. **Freeze Duration (ms)**: The total duration of video freezes during playback, measured in milliseconds.
10. **Playback Duration (ms)**: The total duration of the video playback session, measured in milliseconds.
11. **Total Playback Duration (ms)**: The total time spent in the playback phase, measured in milliseconds.
12. **Freeze Count**: The number of times the video freezes during playback.
13. **Video Bitrate (kbps)**: The bitrate of the video, measured in kilobits per second.
14. **Initial Buffering Downloaded Data (byte)**: The amount of data downloaded during the initial buffering phase, measured in bytes.
15. **Video Quality Score (SQuality)**: A score representing the overall quality of the video.
16. **Initial Buffering Score (SLoading)**: A score representing the performance of the initial buffering phase.
17. **Freeze Score (SStalling)**: A score representing the performance of the video in terms of stalling or freezing.




This dataset was used for analysis in the following research article:

*Wang, Q., Dai, HN., Wu, D. et al. Data analysis on video streaming QoE over mobile networks. J Wireless Com Network 2018, 173 (2018). https://doi.org/10.1186/s13638-018-1180-8*