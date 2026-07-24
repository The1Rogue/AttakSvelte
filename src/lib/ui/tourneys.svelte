
<script lang="ts">



let ongoing: Array<any> = $state([])
let past: Array<any> = $state([])

fetch("https://api.playtak.com/events").then((resp) => resp.json()).then((data) => {
    parseTourneyData(data)
})

// let data = {"data":[{"name":"Tak League Season 5 (Ongoing)","event":"Tournament","category":"Special","start_date":"Sep 15, 2025","end_date":"Mid 2026","details":"https://ustak.org/league/season-5/info","registration":null,"standings":"https://docs.google.com/spreadsheets/d/1gHn1E37ooQjIHNudvyYAnyOvfOnG19li9TSypVuWg_A/edit?gid=915423806#gid=915423806"},{"name":"Tak Open (Finished)","event":"Tournament","category":"Championship Cycle","start_date":"Nov 14, 2025","end_date":"Dec 28, 2025","details":"https://ustak.org/2025/open/info","registration":null,"standings":"https://ustak.org/2025/open"},{"name":"PAX Unplugged (Finished)","event":"Convention","category":"Convention","start_date":"Nov 22, 2025","end_date":"Nov 22, 2025","details":"https://unplugged.paxsite.com/","registration":null,"standings":null},{"name":"January 2026 Beginner Tournament (Finished)","event":"Tournament","category":"Beginner","start_date":"Jan 17, 2026","end_date":"Feb 16, 2026","details":"https://ustak.org/2026/january-beginner/info","registration":null,"standings":"https://ustak.org/2026/january-beginner/finals.html"},{"name":"Mentor/Mentee Tournament (Finished)","event":"Tournament","category":"Special","start_date":"Feb 20, 2026","end_date":"Apr 12, 2026","details":"https://ustak.org/2026/mentor-mentee/info","registration":null,"standings":"https://docs.google.com/spreadsheets/d/1bCqqf2BoEAWSBmrVcWoeLfSZXAvfKFNUJzJZGtEyeIE/edit?gid=0#gid=0"},{"name":"7x7 Open (Ongoing)","event":"Tournament","category":"Special","start_date":"Apr 02, 2026","end_date":"Early May","details":"https://ustak.org/2026/7x7-open/info","registration":null,"standings":"https://ustak.org/2026/7x7-open/"},{"name":"May Intermediate Tournament (Planning)","event":"Tournament","category":"Intermediate","start_date":"May 13, 2026","end_date":"Jun 17, 2026","details":"https://ustak.org/2026/may-intermediate/info","registration":null,"standings":null},{"name":"USTA Members' Tournament (Planning)","event":"Tournament","category":"Championship Cycle","start_date":"Jul 01, 2026","end_date":"Aug 11, 2026","details":"https://ustak.org/2026/members/info","registration":null,"standings":null},{"name":"Dragon Cup (Planning)","event":"Tournament","category":"Special","start_date":"August","end_date":null,"details":null,"registration":null,"standings":null},{"name":"September Beginner Tournament (Planning)","event":"Tournament","category":"Beginner","start_date":"September","end_date":null,"details":null,"registration":null,"standings":null},{"name":"Trans-AtlanTAK Cup (Planning)","event":"Tournament","category":"Special","start_date":"October","end_date":null,"details":null,"registration":null,"standings":null}],"categories":["All","Special","Championship Cycle","Convention","Beginner","Intermediate"]}


function parseTourneyData(data: any) {
    for (let event of data.data) {
        if (event.end_date == null) { continue }
        let ev = {
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            link: event.standings,
        }
        if (event.standings == null) {
            if (event.registration == null) {
                ev.link = event.details
            } else {
                ev.link = event.registration
            }
        }

        let idx = ev.name.indexOf("(")
        if (idx > 0) {
            ev.name = ev.name.substring(0, idx - 1)
        }
        if (Date.parse(ev.start_date) > Date.now() || Date.parse(ev.end_date) > Date.now()) { // TODO end date may not be a proper date format (eg: "Mid 2026" or "Early May")
            ongoing.push(ev)
        } else {
            past.push(ev)
        }
    }
}

</script>



<div class="list ui_panel" style:--columns=2>
    <h3 id="ongoing">
        Ongoing Tournaments
    </h3>
    {#each ongoing as event}
        <a class="tourney go_button" href={event.link} target="_blank">
            <p>{event.name}</p>
            <p>{event.start_date} - {event.end_date}</p>
        </a>
    {/each}
    <h3 id="past">
        Past Tournaments
    </h3>
    {#each past as event}
        <a class="tourney go_button" href={event.link} target="_blank">
            <p>{event.name}</p>
            <p>{event.start_date} - {event.end_date}</p>
        </a>
    {/each}
</div>

<style>

.tourney {
    font-size: 13.3px;  /* i dont know why these arent just the right size from the get go but oh well i guess? */
}


</style>