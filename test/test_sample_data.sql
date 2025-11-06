-- Sample data to visualize dashboard

-- Clear existing for a clean demo (optional)
-- DELETE FROM vehicle_detections; DELETE FROM light_status; DELETE FROM emergency_events; DELETE FROM stats;

-- Vehicles for all 8 lanes
INSERT INTO vehicle_detections (intersection, lane, cars, bikes, buses, trucks, pedestrians, camera_rotation) VALUES
('int1','north', 6, 2, 1, 0, 0, 0),
('int1','south', 2, 1, 0, 1, 0, 180),
('int1','east',  3, 0, 0, 0, 0, 90),
('int1','west',  4, 2, 0, 0, 0, 270),
('int2','north', 1, 0, 0, 0, 0, 0),
('int2','south', 5, 2, 0, 1, 0, 180),
('int2','east',  2, 3, 0, 0, 0, 90),
('int2','west',  7, 1, 1, 0, 0, 270);

-- Traffic lights (use upsert semantics)
INSERT INTO light_status (intersection, lane, color, duration, reason) VALUES
('int1','north','green',45,'Base 20s + cars: +15s + bus: +10s'),
('int1','south','red',25,'Opposite side green'),
('int1','east','red',25,'Opposite side green'),
('int1','west','red',25,'Opposite side green'),
('int2','north','red',25,'Opposite side green'),
('int2','south','green',40,'High volume southbound'),
('int2','east','red',25,'Opposite side green'),
('int2','west','red',25,'Opposite side green')
ON CONFLICT (id) DO NOTHING;

-- Emergency (optional demo)
INSERT INTO emergency_events (type, intersection, lane, distance, status, priority)
VALUES ('ambulance','int1','north',48,'active',1);

-- Stats snapshot
INSERT INTO stats (total_vehicles_today, avg_wait_time, emergencies_handled, accidents_detected, fuel_saved_estimate)
VALUES (320, 18.5, 2, 0, 16.0);


