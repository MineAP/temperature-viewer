# Node.js + Mustache + Chart.jsで温湿度をグラフ表示するWebアプリ

## 概要

- ラズパイ上で動作するNode.jsアプリケーション（HTML画面あり）
- ラズパイ上に構築済みの温湿度センサーの値を取得するWebAPI( https://github.com/MineAP/raspberrypi-camera-server )から定期的に温湿度を収集してRedisに保存する。
- 保存した温湿度をChart.jsを使ってグラフ表示する。

## 動作環境

温湿度センサーWebAPI( https://github.com/MineAP/raspberrypi-camera-server )と同じ環境で動作することを想定する。

- ハードウェア＆OS
  - RaspberryPi 4
  - Raspbian GNU/Linux 10 (buster)

- npm

  ```
  $ sudo apt install npm
  ```

- Node.js (12.x)

  ラズパイのaptサーバーに登録されてるnode.jsは10.xなので、12を追加してインストールする。

  ```
  $ sudo curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -
  $ sudo apt-get install -y nodejs
  ```

- Redis

  ```
  $ sudo apt-get install redis-server
  ```

## パッケージインストール

  ```
  $ npm install
  ```

## 動かす

  起動用シェルスクリプトを実行

  ```
  $ start-server.sh
  ```

  Webブラウザで以下のURLを開く

    http://raspberrypi.local:3000/history
