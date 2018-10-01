---
layout: page
title: 전체 인물
permalink: /people/
---
가나다 순 전체 인물 목록입니다.

위키데이터의 인물 데이터 중 해당 인물, 해당 인물의 배우자, 해당 인물의 부모, 해당 인물의 자녀가
조선, 대한제국, 대한민국, 북한(조선민주주의인민공화국) 국적을 가지는 경우, 아래 목록에 나타납니다.

<table>
    <thead><tr>
        <th>이름</th>
        <th>설명</th>
    </tr></thead>
    <tbody>
    {% assign items = site.data.persons %}
    {% for person in items %}
        <tr>
            <td><a href="{{ site.baseurl }}/explorer?keys={{ person.key }}&expands=2">{{ person.name }}</a></td>
            <td>{{ person.description }}</td>
        </tr>
    {% endfor %}
    </tbody>
</table>
