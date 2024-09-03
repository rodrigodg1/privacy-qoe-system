#!/bin/bash

# Variables
CONTAINER_NAME="0e6736aeb83a"  # Replace with your container name or ID
OUTPUT_FILE="docker_metrics.csv"

# Initialize CSV file with headers
echo "Timestamp,CPU_Usage(%),Memory_Usage(MB)" > $OUTPUT_FILE

# Function to get current CPU and memory usage of the container
get_docker_stats() {
    # Get the current timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Get CPU and memory usage using docker stats
    STATS=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}}" $CONTAINER_NAME)
    
    # Extract CPU and Memory usage values
    CPU_USAGE=$(echo $STATS | awk -F',' '{print $1}' | tr -d '%')
    MEMORY_USAGE=$(echo $STATS | awk -F',' '{print $2}' | awk '{print $1}' | sed 's/MiB//')

    # If memory is in GiB, convert it to MiB
    MEMORY_UNIT=$(echo $STATS | awk -F',' '{print $2}' | awk '{print $2}')
    if [ "$MEMORY_UNIT" = "GiB" ]; then
        MEMORY_USAGE=$(echo "$MEMORY_USAGE * 1024" | bc)
    fi

    # Append data to CSV file
    echo "$TIMESTAMP,$CPU_USAGE,$MEMORY_USAGE" >> $OUTPUT_FILE
}

# Infinite loop to collect stats every second
while true; do
    get_docker_stats
    sleep 1
done
