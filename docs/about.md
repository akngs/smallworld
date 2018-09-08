---
layout: page
title: 소개
permalink: /about/
---

## 개요

대한민국 인맥지도는 정치인, 기업인, 방송연예인 등 위키데이터에 등재된 유명 인물들 사이의 지연, 학연,
혈연 등을 쉽게 살펴볼 수 있도록 도와주는 서비스입니다.


## 데이터 수집 기준

위키데이터의 인물 데이터 중 해당 인물, 해당 인물의 배우자, 해당 인물의 부모, 해당 인물의 자녀가
조선, 대한제국, 대한민국, 북한(조선민주주의인민공화국) 국적을 가지는 경우, 해당 인물에 대하여 다음
데이터를 수집하여 보여줍니다.

* 이름
* 이미지
* 출생일, 사망일
* 출생지역
* 멤버십(memberships)
* 소속(affiliation)
* 직업
* 출신학교
* 직위

## 사용한 소프트웨어

* 소스코드 및 데이터: [https://github.com/akngs/smallworld](https://github.com/akngs/smallworld)
* 홈페이지: [jekyllrb.com](https://jekyllrb.com/) on [GitHub Pages](https://pages.github.com/)
* 디자인: [minima](https://github.com/jekyll/minima)
* 데이터: [위키데이터](https://wikidata.org)
* 기타 라이브러리:
  * [인맥 탐색기](explorer)의 네트워크 시각화 등에 자바스크립트 라이브러리
    [d3js](https://d3js.org)를 활용하였습니다.
  * 네트워크 분석에 파이썬 라이브러리 [networkx](https://networkx.github.io/)와 자바스크립트
    라이브러리 [jsnetworkx](http://jsnetworkx.org)를 사용하였습니다.
