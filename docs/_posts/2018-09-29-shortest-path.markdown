---
layout: post
title:  두 인물 사이의 관계 검색하기
date:   2018-09-29 22:20:00 +0900
---
인물을 클릭하여 선택한 상태에서 새로운 인물을 검색하면 두 인물 사이의 최단 경로를 찾아주는 기능을
추가하였습니다. 예를 들어 [이명박]({{ site.baseurl }}/explorer/?keys=Q14342)을 검색하여 선택한 후
[전두환]({{ site.baseurl }}/explorer/?keys=Q14362)을 검색하면 이 두 사람 사이를 잇는 최단 인맥을
찾아서 보여줍니다.

![이명박-전두환 최단 인맥]({{ site.baseurl }}/assets/imgs/shortest-path.png)

아래 버튼을 클릭하시면 두 사람 사이의 인맥을 탐색할 수 있습니다.

<p style="text-align: center; margin: 2rem 0">
    <span class="btn"><a href="{{ site.baseurl }}/explorer/?npaths=이명박-전두환">
    이명박-전두환 검색
    </a></span>
</p>

관련이 있는 것으로 알려진 두 인물이 연결되지 않거나 이미 알려진 최단 경로보다 멀리 돌아서 연결된다면
해당 데이터가 아직 없다는 뜻입니다. 이런 사례를 발견하면 [위키데이터 사이트](https://wikidata.org)에
접속해서 부모-자식 관계 또는 배우자 관계에 대한 정보를 추가해주세요.
