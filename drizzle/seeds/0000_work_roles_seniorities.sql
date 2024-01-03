INSERT INTO work_role (id, name, description) VALUES
('300a6de1-b749-44df-81e9-a023228363e1', 'Product Manager', 'Supervisa el desarrollo y entrega de productos.'),
('dddc2ab9-c113-438d-a802-1e4c5231c33f', 'Diseñador UX', 'Diseña interfaces de usuario y experiencias de usuario para productos de software.'),
('19bab8ab-357d-4171-89be-1657fff171f2', 'Data Scientist', 'Analiza e interpreta datos complejos para ayudar a informar decisiones empresariales.'),
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', 'DevOps', 'Asegura la implementación y operación eficiente del software.'),
('fce003ea-cd87-46ed-9947-670b98460967', 'Ingeniero de QA', 'Asegura la calidad del software mediante pruebas.'),
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', 'Escritor Técnico', 'Crea documentación para productos de software.'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'Ingeniero de Seguridad', 'Se enfoca en los aspectos de seguridad de los sistemas de software.'),
('5585979d-db32-41b7-b193-6f3a75c410da', 'Administrador de Bases de Datos', 'Gestiona y mantiene los sistemas de bases de datos.'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', 'Ingeniero de Redes', 'Responsable de configurar, desarrollar y mantener redes informáticas.'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', 'Analista de Sistemas', 'Analiza qué tan bien el software, el hardware y el sistema de TI en general se ajustan a las necesidades empresariales.'),
('3d77d3e2-b61d-45e5-9ab4-a98f364a164d', 'Manager de Ingenería', 'Responsable de planificar, ejecutar y supervisar proyectos.'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324', 'Ingeniero de Cloud', 'Gestiona y opera sistemas de computación en la nube.'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde', 'Ingeniero de Software - Front-End', 'Desarrolla los aspectos visibles al usuario del software.'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0', 'Ingeniero de Software - Back-End', 'Se enfoca en el lado del servidor del desarrollo de software.'),
('c8c212d3-dabf-4a35-93be-002be7d314de', 'Ingeniero de Software - Móvil', 'Se especializa en desarrollar aplicaciones para dispositivos móviles.'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee', 'Ingeniero de Software - de Juegos', 'Desarrolla videojuegos.'),
('3b754029-24d3-4011-9574-8e8b2fa6c631', 'Ingeniero de Software', 'Trabaja tanto en el front-end como en el back-end del software.'),
('af361c4f-3462-444c-a65a-290e79a04936', 'Ingeniero de Machine Learning', 'Diseña y desarrolla sistemas de aprendizaje automático y aprendizaje profundo.'),
('aa42a53a-25f7-4498-be74-07394a57fff4', 'Arquitecto de Software', 'Responsable de la planificación y diseño de la estructura del software.'),
('08f9531b-3833-48d2-a8e2-a24e28297547', 'Consultor de TI', 'Proporciona asesoramiento y experiencia en tecnologías de la información.'),
('4170f3f3-c03a-46ad-80c9-95803544e194', 'IT / Especialista en Soporte Técnico', 'Brinda asistencia técnica y soporte para problemas de software y hardware.'),
('e8d717e9-6bf2-4e7f-a9f1-0b21161db794', 'Director de Ingenería / Gerente de Ingenería / Gerente de TI', 'Supervisa las operaciones de tecnología de la información en una organización.'),
('a343007d-a721-49dd-b894-b215388dcc3a', 'Developer Advocate / Developer Relations', 'Maneja la relación entre una empresa y la comunidad de desarrollo.');
--> statement-breakpoint

INSERT INTO work_seniority (id, name, description) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'N/A', 'N/A'),
('21c41ebe-ffcc-400b-8456-400228b536b4', 'Junior', 'Nivel de entrada con poca o ninguna experiencia.'),
('a021c973-3c03-44fe-b57f-5471ed2d2705', 'Semi-Senior', 'Nivel intermedio con alguna experiencia en el campo.'),
('265ad7a6-2d61-4222-abf1-8e3881bf2748', 'Senior', 'Experimentado y altamente capacitado en el campo.'),
('cc5dd2b8-1d2f-4794-9a11-ee1663d98db3', 'Staff (Lead)', 'Lidera equipos o proyectos, muy experimentado.'),
('e6ee2511-b003-4af1-a877-b1e19a010a90', 'Principal', 'Muy experimentado, a menudo un experto en la materia senior.'),
('4b669b51-4620-4ac8-aa35-6305b4405b76', 'Director', 'Rol de liderazgo senior, supervisa múltiples equipos o departamentos.'),
('0eb2f6b5-141b-4237-90a0-215db8f46722', 'Pasantía (Práctica Laboral)', 'Posición temporal para estudiantes o practicantes para ganar experiencia laboral.'),
('f89cadac-cb09-48e3-88fe-f9516043bc4c', 'Entry Level / Asociado ', 'Rango por debajo del rol completo, a menudo para profesionales menos experimentados o de nivel de entrada.');
--> statement-breakpoint

INSERT INTO work_seniority_and_role (work_role_id, work_seniority_id) VALUES

-- Product Manager
('300a6de1-b749-44df-81e9-a023228363e1', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('300a6de1-b749-44df-81e9-a023228363e1', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),

-- Diseñador UX
('dddc2ab9-c113-438d-a802-1e4c5231c33f', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('dddc2ab9-c113-438d-a802-1e4c5231c33f', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('dddc2ab9-c113-438d-a802-1e4c5231c33f', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('dddc2ab9-c113-438d-a802-1e4c5231c33f', 'e6ee2511-b003-4af1-a877-b1e19a010a90'),

-- Data Scientist
('19bab8ab-357d-4171-89be-1657fff171f2', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('19bab8ab-357d-4171-89be-1657fff171f2', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('19bab8ab-357d-4171-89be-1657fff171f2', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('19bab8ab-357d-4171-89be-1657fff171f2', 'e6ee2511-b003-4af1-a877-b1e19a010a90'),

-- DevOps
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('aab98d1f-ec86-4d9b-91d6-2b44e322d0a2', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- QA
('fce003ea-cd87-46ed-9947-670b98460967', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('fce003ea-cd87-46ed-9947-670b98460967', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('fce003ea-cd87-46ed-9947-670b98460967', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('fce003ea-cd87-46ed-9947-670b98460967', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('fce003ea-cd87-46ed-9947-670b98460967', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- Escritor Técnico
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('442ec15f-fa9a-4fbc-ab2d-cac212c01ee7', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- Ingeniero de Seguridad
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', 'e6ee2511-b003-4af1-a877-b1e19a010a90'),
('4a9de754-426f-4ffb-8a75-d6a28484bcb5', '4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Administrador de Bases de Datos
('5585979d-db32-41b7-b193-6f3a75c410da', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('5585979d-db32-41b7-b193-6f3a75c410da', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('5585979d-db32-41b7-b193-6f3a75c410da', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('5585979d-db32-41b7-b193-6f3a75c410da', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('5585979d-db32-41b7-b193-6f3a75c410da', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- Ingeniero de Redes
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', 'f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('5250b7de-a5a0-4120-9bb2-6825daaa85b8', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- Analista de Sistemas
('ebb700d6-97bf-4150-96e2-3207b87a91f5', 'f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', '21c41ebe-ffcc-400b-8456-400228b536b4'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', 'a021c973-3c03-44fe-b57f-5471ed2d2705'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('ebb700d6-97bf-4150-96e2-3207b87a91f5', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),

-- Manager de Ingenería
('3d77d3e2-b61d-45e5-9ab4-a98f364a164d', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('3d77d3e2-b61d-45e5-9ab4-a98f364a164d', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),

-- Ingeniero de Cloud
('bb20dc8a-8001-45aa-a812-8f0c7b334324','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','21c41ebe-ffcc-400b-8456-400228b536b4'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('bb20dc8a-8001-45aa-a812-8f0c7b334324','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Software - Front-End
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','21c41ebe-ffcc-400b-8456-400228b536b4'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('6b1ef4ec-48c9-475b-a225-d6b708fa5dde','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Software - Back-End
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','21c41ebe-ffcc-400b-8456-400228b536b4'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('bbaaf0d2-d9da-45e6-b8fa-7f361bec59f0','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Software - Full-Stack
('3b754029-24d3-4011-9574-8e8b2fa6c631','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','21c41ebe-ffcc-400b-8456-400228b536b4'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('3b754029-24d3-4011-9574-8e8b2fa6c631','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Software - Móvil', 
('c8c212d3-dabf-4a35-93be-002be7d314de','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('c8c212d3-dabf-4a35-93be-002be7d314de','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('c8c212d3-dabf-4a35-93be-002be7d314de','21c41ebe-ffcc-400b-8456-400228b536b4'),
('c8c212d3-dabf-4a35-93be-002be7d314de','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('c8c212d3-dabf-4a35-93be-002be7d314de','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('c8c212d3-dabf-4a35-93be-002be7d314de','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('c8c212d3-dabf-4a35-93be-002be7d314de','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('c8c212d3-dabf-4a35-93be-002be7d314de','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Software - de Juegos
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','21c41ebe-ffcc-400b-8456-400228b536b4'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('f0e39ce3-e717-4c04-b061-8e5dc14304ee','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Ingeniero de Machine Learning
('af361c4f-3462-444c-a65a-290e79a04936','f89cadac-cb09-48e3-88fe-f9516043bc4c'),
('af361c4f-3462-444c-a65a-290e79a04936','0eb2f6b5-141b-4237-90a0-215db8f46722'),
('af361c4f-3462-444c-a65a-290e79a04936','21c41ebe-ffcc-400b-8456-400228b536b4'),
('af361c4f-3462-444c-a65a-290e79a04936','a021c973-3c03-44fe-b57f-5471ed2d2705'),
('af361c4f-3462-444c-a65a-290e79a04936','265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('af361c4f-3462-444c-a65a-290e79a04936','cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('af361c4f-3462-444c-a65a-290e79a04936','e6ee2511-b003-4af1-a877-b1e19a010a90'),
('af361c4f-3462-444c-a65a-290e79a04936','4b669b51-4620-4ac8-aa35-6305b4405b76'),

-- Arquitecto de Software
('aa42a53a-25f7-4498-be74-07394a57fff4', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('aa42a53a-25f7-4498-be74-07394a57fff4', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),

-- Consultor de TI
('08f9531b-3833-48d2-a8e2-a24e28297547', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('08f9531b-3833-48d2-a8e2-a24e28297547', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),

-- IT / Soporte Técnico
('4170f3f3-c03a-46ad-80c9-95803544e194', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),

-- Gerente de TI
('e8d717e9-6bf2-4e7f-a9f1-0b21161db794', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),

-- Software Advocate (Developer Relations)
('a343007d-a721-49dd-b894-b215388dcc3a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
('a343007d-a721-49dd-b894-b215388dcc3a', '265ad7a6-2d61-4222-abf1-8e3881bf2748'),
('a343007d-a721-49dd-b894-b215388dcc3a', 'cc5dd2b8-1d2f-4794-9a11-ee1663d98db3'),
('a343007d-a721-49dd-b894-b215388dcc3a', 'e6ee2511-b003-4af1-a877-b1e19a010a90');

