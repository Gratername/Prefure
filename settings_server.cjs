const { exec } = require('child_process');

function changeTCPOptions() {
    const congestionControlOptions = ['cubic', 'reno', 'bbr', 'dctcp', 'hybla'];
    const sackOptions = ['1', '0'];
    const windowScalingOptions = ['1', '0'];
    const timestampsOptions = ['1', '0'];
    const selectiveAckOptions = ['1', '0'];
    const tcpFastOpenOptions = ['3', '2', '1', '0'];

    const congestionControl = congestionControlOptions[Math.floor(Math.random() * congestionControlOptions.length)];
    const sack = sackOptions[Math.floor(Math.random() * sackOptions.length)];
    const windowScaling = windowScalingOptions[Math.floor(Math.random() * windowScalingOptions.length)];
    const timestamps = timestampsOptions[Math.floor(Math.random() * timestampsOptions.length)];
    const selectiveAck = selectiveAckOptions[Math.floor(Math.random() * selectiveAckOptions.length)];
    const tcpFastOpen = tcpFastOpenOptions[Math.floor(Math.random() * tcpFastOpenOptions.length)];

    const command = `sudo sysctl -w net.ipv4.tcp_congestion_control=${congestionControl} \
net.ipv4.tcp_sack=${sack} \
net.ipv4.tcp_window_scaling=${windowScaling} \
net.ipv4.tcp_timestamps=${timestamps} \
net.ipv4.tcp_sack=${selectiveAck} \
net.ipv4.tcp_fastopen=${tcpFastOpen}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка при изменении настроек TCP: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Ошибка при выполнении команды: ${stderr}`);
            return;
        }
        console.log(`Настройки TCP изменены:
      congestion_control=${congestionControl},
      tcp_sack=${sack},
      tcp_window_scaling=${windowScaling},
      tcp_timestamps=${timestamps},
      tcp_sack=${selectiveAck},
      tcp_fastopen=${tcpFastOpen}`);
    });
}

setInterval(changeTCPOptions, 1000);
