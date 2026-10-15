# GeoTrace GIS: Test Cases

## A. Automated

Run from the repository root:

```bash
python tests/test_sample_data.py
```

| ID | Test | Expected |
|---|---|---|
| AT-01 | `route_deviation.geojson` is a FeatureCollection with planned, actual, deviation and survey features | Pass |
| AT-02 | All coordinates are valid `[lng, lat]` values inside India's bounding box | Pass |
| AT-03 | Largest distance of the actual route from the planned route is between 5.5 m and 6.5 m | Pass |
| AT-04 | Sample evidence `sha256` equals the SHA-256 of its sample payload text | Pass |
| AT-05 | Sample evidence GNSS points have `lat`, `lng`, `alt`, `acc_m`, `t` and valid timestamps | Pass |
| AT-06 | Sample AR pipe has at least 2 vertices and a negative depth | Pass |

## B. Manual: Flutter capture app (real Android phone)

| ID | Steps | Expected result |
|---|---|---|
| MT-01 | Open the app first time | Camera and Location permission prompts appear |
| MT-02 | Deny location permission | Screen shows a clear message explaining how to enable it |
| MT-03 | Turn the phone GPS off, open the app | Message asks the user to turn on GPS |
| MT-04 | Allow permissions, go outside, wait | Overlay shows latitude, longitude and accuracy in metres |
| MT-05 | Tap the red button, walk a few metres, tap again | Recording stops; the "Track pts" counter was increasing; queue count goes up by 1 |
| MT-06 | Turn on airplane mode, record a clip | Clip is queued; status text says it is queued (offline) |
| MT-07 | Turn airplane mode off with the backend running | The queue empties automatically and the count goes down |
| MT-08 | Run with no backend, tap the sync button | Clip stays queued, no crash |
| MT-09 | Close and reopen the app with clips in the queue | Pending count is still correct (queue is persistent) |

## C. Manual: AR view

| ID | Steps | Expected result |
|---|---|---|
| MT-10 | Open the AR tab on an ARCore phone and move the phone slowly | A blue pipe with orange joints appears in front of the camera |
| MT-11 | Look at the bottom of the AR screen | Orange banner says AR shows stored records only, does not detect buried pipes, and says to verify before digging |
| MT-12 | Switch tabs between Capture and AR several times | No crash; camera and AR work each time |
| MT-13 | Open the AR tab on a device without ARCore or on iOS | Screen shows the warning and does not crash |

## D. Manual: Review dashboard

| ID | Steps | Expected result |
|---|---|---|
| MT-14 | Run `npm run dev`, open http://localhost:5173 | Light-theme page with map and review panel; status is Pending review |
| MT-15 | Look at the map | Dashed planned line, solid blue actual line, red deviation, 3 orange survey points |
| MT-16 | Hover over a survey point | Popup shows its label, for example "Survey point S2" |
| MT-17 | Click Approve | Status becomes Approved; buttons are disabled; audit log gets a new line |
| MT-18 | Click Reopen, then Reject with an empty comment | Error message asks for a comment; status does not change |
| MT-19 | Type a comment, click Reject | Status becomes Rejected; log shows the comment |
| MT-20 | Reopen, type a comment, click Request more evidence | Status becomes More evidence requested |
| MT-21 | Resize the browser window | Panel and map stay usable |

## E. Pass criteria

Automated tests all pass, and MT-01 to MT-20 behave as described on one real Android phone and one browser.
