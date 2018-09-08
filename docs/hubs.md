---
layout: default
title: 주요 인물
---
## 주요 인물

네트워크 분석을 통해 자동으로 추출한 주요 인물 목록입니다.

위키데이터에 인물 사이의 관계에 대한 정보가 풍성해지면 더 정확한 분석을 할 수 있습니다.
위키데이터는 누구나 내용을 수정할 수 있는 위키 기반 데이터베이스 입니다.

데이터 개선에 <a href="https://wikidata.org" target="_blank">참여해주세요.</a>

<table>
    <thead><tr>
        <th>이름</th>
        <th>설명</th>
    </tr></thead>
    <tbody>
    {% assign items = site.hubs | sort: 'score' | reverse %}
    {% for person in items %}
        <tr>
            <td><a href="{{ person.url | relative_url }}">{{ person.name }}</a></td>
            <td>{{ person.description }}</td>
        </tr>
    {% endfor %}
    </tbody>
</table>
