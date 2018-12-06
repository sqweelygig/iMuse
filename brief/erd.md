# Entity Relationship Statements

* The `iMuseTech` knows the `Config URL` for each `Museum`.
* The `iMuseTech` knows the `Museum` for each `Cabinet`.
* The `Museum` can author `Articles` in the `Wiki`.
* The `Wiki` now stores the `Articles`, so the `Public` can view them.
* The `Museum` can author the `FX Scripts` in the `Wiki`.
* The `Public` can request one of the `FX Scripts` for a `Cabinet`.
* The `Museum` knows their `Security` preferences so can author `Security` in the `Config`.
* The `Museum` knows their `WiFi details` so can configure the `WiFi` in the `Config`.
* The `Museum` knows what their `Cabinets` should be doing when nothing is requested so can configure `Default Scripts` in the `ConfigWiki`.
* The `Cabinet` can check `Security` against the `Config`.
* The `Cabinet` can load and display the `Special FX`.
* The `Cabinet` can default to a `Default FX`.
* The `Cabinet` can request `WiFi Details` from the `Config`.
* The `Cabinet` can control its attachments.
