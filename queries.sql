-- A set of sample queries

select *
from plays
where trackName like "Althea - 2013 Remaster";

select distinct trackName
from plays as songs;

select trackName, count(*) as times
from plays
where msPlayed >= 10000
group by trackName
order by times asc;

select trackName, sum(msPlayed) as timeListened
from plays
group by trackname
order by timeListened desc;

select artistName, sum(msPlayed) as timeListened
from plays
group by artistName
order by timeListened desc;

select trackName, count(*) as times
from plays
where msPlayed >= 10000
group by trackName
order by times desc LIMIT 10;

select count
(*) from plays;