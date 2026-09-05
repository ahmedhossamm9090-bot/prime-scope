-- ==============================================================================
-- Prime Scope - Initial Seed Data (Categories, Materials, and Showcase Projects)
-- Description: One-click population of catalog data into Supabase PostgreSQL
-- ==============================================================================

-- 1. Populate Categories
INSERT INTO public.categories (id, name_ar, name_en, icon, badge, sort_order) VALUES
('italian', 'الرخام الإيطالي', 'Italian Marble', '🇮🇹', 'فاخر', 1),
('spanish', 'الرخام الإسباني', 'Spanish Marble', '🇪🇸', 'مميز', 2),
('turkish', 'الرخام التركي', 'Turkish Marble', '🇹🇷', 'شائع', 3),
('portuguese', 'الرخام البرتغالي', 'Portuguese Marble', '🇵🇹', 'أصيل', 4),
('greek', 'الرخام اليوناني', 'Greek Marble', '🇬🇷', 'أبيض ناصع', 5),
('saudi', 'الرخام والجرانيت السعودي', 'Saudi Marble & Granite', '🇸🇦', 'صلابة وجودة', 6),
('riyadh-stone', 'حجر الرياض ونساح', 'Riyadh & Nassah Stone', '🏛️', 'واجهات طبيعية', 7),
('omani', 'رخام عماني وجرانيت عالمي', 'Omani, Exotic & Granite', '🇴🇲', 'عصري', 8)
ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    badge = EXCLUDED.badge,
    sort_order = EXCLUDED.sort_order;

-- 2. Populate Materials
INSERT INTO public.materials (id, name_ar, name_en, category_id, color_desc, origin, type_ar, type_en, finish, usage_ar, usage_en, price_tier, color_hex, stone_type, color_group, density, water_absorption, compressive_strength, durability_score, maintenance_tier) VALUES
-- Italian Marble
('it-1', 'ستاتواريتو', 'Statuarietto', 'italian', 'أبيض بعروق رمادية ناعمة وتشكيلات سحابية أنيقة', 'إيطاليا / Italy', 'رخام طبيعي فاخر', 'Luxury Natural Marble', 'لامع / مطفي', 'أرضيات الصالات، جدران رئيسية، مجالس', 'Living floors, accent walls, majlis', 'VIP (فاخر جداً)', '#f8fafc', 'marble', 'white', '2710 kg/m³', '0.14%', '135 MPa', 4.5, 'متوسطة (عزل سنوي)'),
('it-2', 'كالاكاتا', 'Calacatta', 'italian', 'أبيض كلاسيكي نقي بتعريقات عريضة مميزة ودافئة', 'إيطاليا / Italy', 'رخام كالاكاتا إيطالي', 'Italian Calacatta', 'لامع (Polished)', 'مطابخ فاخرة، مجالس، حمامات ماستر', 'Kitchens, majlis, master baths', 'VIP', '#ffffff', 'marble', 'white', '2720 kg/m³', '0.12%', '140 MPa', 4.6, 'عالية العناية'),
('it-3', 'كالاكاتا جولد', 'Calacatta Gold', 'italian', 'أبيض ناصع بعروق ذهبية ورمادية عريضة متناسقة', 'إيطاليا / Italy', 'رخام كالاكاتا جولد الفاخر', 'Calacatta Gold Luxury', 'بوكماتش لامع (Bookmatch)', 'جزر المطابخ، جدران تلفزيون، مداخل القصور', 'Kitchen islands, TV feature walls, palace foyers', 'Ultra VIP', '#fef08a', 'marble', 'white', '2725 kg/m³', '0.11%', '145 MPa', 4.8, 'متوسطة'),
('it-4', 'كالاكاتا فيولا', 'Calacatta Viola', 'italian', 'أبيض عاجي بعروق بنفسجية وعنابية حادة وفريدة', 'إيطاليا / Italy', 'رخام كالاكاتا فيولا النادر', 'Rare Calacatta Viola', 'لامع / مطفي ساتين', 'مغاسل ديكورية، طاولات قهوة، جدران استثنائية', 'Statement vanities, coffee tables, powder rooms', 'Ultra VIP', '#581c87', 'marble', 'pink', '2700 kg/m³', '0.18%', '130 MPa', 4.4, 'عالية العناية'),
('it-5', 'بيانكو كارارا', 'Bianco Carrara', 'italian', 'رمادي فاتح كلاسيكي بعروق رمادية متناغمة ناعمة', 'إيطاليا / Italy', 'رخام كارارا كلاسيكي', 'Classic Carrara Marble', 'لامع / هوند مطفي', 'حمامات، أرضيات غرف، سلالم، مطابخ مودرن', 'Bathrooms, room floors, stairs, modern kitchens', 'مميز (Premium)', '#e2e8f0', 'marble', 'grey', '2690 kg/m³', '0.19%', '125 MPa', 4.3, 'سهلة'),
('it-6', 'بيانكو جيويا', 'Bianco Gioia', 'italian', 'أبيض لؤلؤي بتعريقات متقاطعة كريستالية', 'إيطاليا / Italy', 'رخام بيانكو جيويا', 'Bianco Gioia Marble', 'لامع', 'أرضيات داخلية، أسطح حمامات، مجالس', 'Interior floors, counters, lounges', 'مميز (Premium)', '#f1f5f9', 'marble', 'white', '2705 kg/m³', '0.15%', '132 MPa', 4.4, 'متوسطة'),
('it-7', 'أرابيسكاتو', 'Arabescato', 'italian', 'أبيض عاجي بعروق دائرية رمادية بشكل لوحات فنية', 'إيطاليا / Italy', 'رخام أرابيسكاتو إيطالي', 'Arabescato Italian', 'لامع / بوكماتش', 'أرضيات المجالس، جدران بوكماتش، مداخل', 'Grand majlis, bookmatch panels, main entries', 'VIP', '#ffffff', 'marble', 'white', '2715 kg/m³', '0.13%', '138 MPa', 4.5, 'متوسطة'),
('it-8', 'فيناتو', 'Venato', 'italian', 'أبيض بعروق طولية متناسقة وهادئة', 'إيطاليا / Italy', 'رخام فيناتو', 'Venato Marble', 'لامع', 'ممرات، صالات استقبال، أروقة', 'Hallways, receptions, arcades', 'مميز', '#f8fafc', 'marble', 'white', '2700 kg/m³', '0.16%', '128 MPa', 4.3, 'سهلة'),
('it-9', 'فيناتينو', 'Venatino', 'italian', 'أبيض عاجي بعروق دقيقة ورقيقة تضفي اتساعاً', 'إيطاليا / Italy', 'رخام فيناتينو', 'Venatino Classic', 'لامع / مطفي', 'صالات، مغاسل، أرضيات مفتوحة', 'Salons, vanities, open areas', 'مميز', '#ffffff', 'marble', 'white', '2700 kg/m³', '0.15%', '130 MPa', 4.4, 'متوسطة'),
('it-10', 'برلاتينو', 'Perlatino', 'italian', 'بيج كلاسيكي بتوشيحات صدفية ونقاء عالي', 'إيطاليا / Italy', 'رخام برلاتينو صقلي', 'Perlatino Sicilian', 'لامع', 'أرضيات فلل كاملة، سلالم، ممرات كبرى', 'Full villa floors, stairs, grand corridors', 'اقتصادي راقي', '#fef3c7', 'marble', 'beige', '2680 kg/m³', '0.22%', '120 MPa', 4.2, 'سهلة جداً'),
('it-11', 'بوتشينو', 'Botticino', 'italian', 'بيج كريمي دافئ متجانس ذو شهرة عريقة عالمياً', 'إيطاليا / Italy', 'رخام بوتشينو أصيل', 'Authentic Botticino', 'لامع / مطفي', 'أرضيات داخلية رئيسية، صالات، قصور', 'Main interior floors, grand salons, palaces', 'مميز (Premium)', '#fde68a', 'marble', 'beige', '2690 kg/m³', '0.20%', '130 MPa', 4.4, 'سهلة'),
('it-12', 'بوتشينو كلاسيكو', 'Botticino Classico', 'italian', 'كريمي ذهبي بعروق بيضاء خفيفة ونقاء نخب أول', 'إيطاليا / Italy', 'بوتشينو كلاسيكو نخب أول', 'Botticino Classico Extra', 'لامع', 'قصور، فلل راقية، مكاتب تنفيذية', 'Palaces, luxury villas, executive suites', 'VIP', '#fef08a', 'marble', 'beige', '2700 kg/m³', '0.18%', '135 MPa', 4.6, 'سهلة'),
('it-13', 'داينو ريالي', 'Daino Reale', 'italian', 'بيج خشبي بتموجات نهرية ممتدة (بريشيا ساردا)', 'إيطاليا / Italy', 'رخام داينو ريالي (ساردينيا)', 'Daino Reale (Breccia Sarda)', 'لامع / مجلي', 'أرضيات معيشة، سلالم، حمامات، جدران', 'Living floors, stairs, bathrooms, walls', 'مميز', '#fed7aa', 'marble', 'beige', '2710 kg/m³', '0.24%', '126 MPa', 4.3, 'سهلة'),
('it-14', 'لازا أورو', 'Lasa Oro', 'italian', 'أبيض نقي بلمسات ذهبية دافئة مستخرج من جبال الألب', 'إيطاليا / Italy', 'رخام لازا أورو النادر', 'Lasa Oro Alpine Marble', 'لامع / ساتين', 'مشاريع فائقة الفخامة، قصور ملكية', 'Ultra luxury villas, royal suites', 'Ultra VIP', '#fef9c3', 'marble', 'gold', '2730 kg/m³', '0.10%', '150 MPa', 4.9, 'متوسطة'),
('it-15', 'لازا سيلفر', 'Lasa Silver', 'italian', 'أبيض ثلجي بتدرجات فضية أنيقة وصلابة كريستالية', 'إيطاليا / Italy', 'رخام لازا سيلفر', 'Lasa Silver White', 'لامع', 'صالات استقبال مودرن، فنادق 5 نجوم', 'Modern receptions, 5-star hotels', 'Ultra VIP', '#ffffff', 'marble', 'white', '2725 kg/m³', '0.11%', '148 MPa', 4.8, 'متوسطة'),
('it-16', 'بورتورو', 'Portoro', 'italian', 'أسود ملكي فاحم بعروق ذهبية وكريستالية براقة', 'إيطاليا / Italy', 'رخام نيرو بورتورو الأسود', 'Nero Portoro Black & Gold', 'لامع كريستالي', 'مداخل قصور، جدران شلالات، كاونترات فاخرة', 'Palace entries, bar tops, feature vanity', 'Ultra VIP', '#0f172a', 'marble', 'black', '2740 kg/m³', '0.15%', '142 MPa', 4.7, 'عالية العناية'),
('it-17', 'بورتورو سيلفر', 'Portoro Silver', 'italian', 'أسود فحمي بعروق فضية بلورية متباينة', 'إيطاليا / Italy', 'رخام بورتورو سيلفر', 'Portoro Silver Italian', 'لامع', 'ديكورات عصرية، كاونترات، حمامات فندقية', 'Modern architecture, bars, luxury baths', 'VIP', '#020617', 'marble', 'black', '2735 kg/m³', '0.16%', '140 MPa', 4.6, 'متوسطة'),
('it-18', 'بريشيا أونيشياتا', 'Breccia Oniciata', 'italian', 'وردي بيج بتشكيلات أونيكس متبلورة دافئة', 'إيطاليا / Italy', 'رخام بريشيا أونيشياتا', 'Breccia Oniciata', 'لامع', 'أعمدة، أروقة، أرضيات استقبال', 'Pillars, grand hallways, receptions', 'مميز', '#fed7aa', 'marble', 'pink', '2695 kg/m³', '0.21%', '122 MPa', 4.2, 'سهلة'),
('it-19', 'تشيبولينو', 'Cipollino', 'italian', 'أخضر متموج بعروق بيضاء وزيتونية أثرية ساحرة', 'إيطاليا / Italy', 'رخام تشيبولينو أخضر', 'Cipollino Green Marble', 'لامع / أثري', 'أعمدة، حمامات سبا فاخرة، جدران ديكور', 'Columns, spa baths, decor walls', 'VIP', '#064e3b', 'marble', 'green', '2720 kg/m³', '0.17%', '134 MPa', 4.5, 'متوسطة'),
('it-20', 'تشيبولينو أوندولاتو', 'Cipollino Ondulato', 'italian', 'تموجات ثلاثية الأبعاد بنفسجية وخضراء ورمادية', 'إيطاليا / Italy', 'تشيبولينو أوندولاتو الفني', 'Cipollino Ondulato Art', 'بوكماتش لامع', 'لوحات جدارية، واجهات فندقية، طاولات ضيافة', 'Wall murals, hotel lobbies, dining tables', 'Ultra VIP', '#4c1d95', 'marble', 'pink', '2730 kg/m³', '0.15%', '138 MPa', 4.7, 'متوسطة'),

-- Spanish Marble
('es-1', 'إمبيرادور دارك', 'Emperador Dark', 'spanish', 'بني شوكولاتة بتعريقات عنكبوتية ذهبية مميزة', 'إسبانيا / Spain', 'رخام إمبيرادور بني داكن', 'Spanish Dark Emperador', 'لامع', 'أرضيات، إطارات أبواب، مغاسل، مصاعد', 'Borders, door frames, sinks, elevators', 'مميز (Premium)', '#451a03', 'marble', 'brown', '2710 kg/m³', '0.22%', '125 MPa', 4.3, 'سهلة'),
('es-2', 'إمبيرادور لايت', 'Emperador Light', 'spanish', 'بني عسلي فاتح بعروق كريمية ناعمة ومتجانسة', 'إسبانيا / Spain', 'رخام إمبيرادور فاتح', 'Spanish Light Emperador', 'لامع / مطفي', 'صالات، غرف معيشة، حمامات، سلالم', 'Living rooms, bathrooms, stairs', 'مميز', '#78350f', 'marble', 'brown', '2700 kg/m³', '0.20%', '128 MPa', 4.4, 'سهلة'),
('es-3', 'كريما مارفيل', 'Crema Marfil', 'spanish', 'بيج عاجي ناعم ومتجانس جداً الأكثر شهرة بالعالم', 'إسبانيا / Spain', 'كريما مارفيل الإسباني الأشهر', 'World Famous Crema Marfil', 'لامع / مطفي', 'أرضيات فلل كاملة، قصور، قاعات كبرى', 'Full villa floors, palaces, grand ballrooms', 'الأكثر طلباً', '#fef3c7', 'marble', 'beige', '2690 kg/m³', '0.18%', '132 MPa', 4.6, 'سهلة جداً'),
('es-4', 'كريما فالنسيا', 'Crema Valencia', 'spanish', 'كريمي برتقالي دافئ بعروق حمراء نارية متباينة', 'إسبانيا / Spain', 'رخام كريما فالنسيا', 'Crema Valencia Marble', 'لامع', 'جدران داخلية، حمامات مميزة، تطعيمات', 'Feature walls, unique baths, inlays', 'مميز', '#fdba74', 'marble', 'gold', '2685 kg/m³', '0.23%', '120 MPa', 4.2, 'سهلة'),
('es-5', 'روسا أليكانتي', 'Rosa Alicante', 'spanish', 'أحمر مرجاني بعروق كالسيت بيضاء مشعة', 'إسبانيا / Spain', 'رخام روسا أليكانتي الأحمر', 'Rosa Alicante Red', 'لامع', 'أرضيات المجالس، تطعيمات زخرفية، أروقة', 'Majlis borders, inlays, heritage corridors', 'مميز', '#dc2626', 'marble', 'pink', '2705 kg/m³', '0.19%', '127 MPa', 4.3, 'سهلة'),
('es-6', 'نيرو ماركينا إسباني', 'Nero Marquina Spanish', 'spanish', 'أسود معتم خالص بعروق كالسيت بيضاء ساطعة', 'إسبانيا / Spain', 'نيرو ماركينا الإسباني الأصلي', 'Original Spanish Marquina', 'لامع كريستالي', 'مغاسل مودرن، كاونترات، أرضيات شطرنج', 'Vanity consoles, bars, checkerboard', 'مميز', '#000000', 'marble', 'black', '2690 kg/m³', '0.17%', '135 MPa', 4.4, 'متوسطة'),
('es-7', 'أونيكس إسباني مضيء', 'Spanish Honey Onyx', 'spanish', 'عسلي كهرماني شفاف ينفذ منه الضوء بجمال ساحر', 'إسبانيا / Spain', 'حجر أونيكس إسباني مضيء', 'Backlit Spanish Onyx', 'لامع شفاف مضاء', 'جدران مضيئة، كاونترات استقبال، شلالات', 'Backlit walls, glowing bars, spas', 'Ultra VIP', '#d97706', 'onyx', 'gold', '2750 kg/m³', '0.08%', '110 MPa', 4.1, 'عالية العناية'),

-- Turkish Marble & Travertine
('tr-26', 'رخام تركي ترافرتين', 'Turkish Travertine Marble', 'turkish', 'بيج عسلي كلاسيكي بعروق ترافرتين متناغمة', 'تركيا / Turkey', 'رخام ترافرتين تركي نخب أول', 'Premium Turkish Travertine', 'معبأ ومجلي / بوش هامر / معتق', 'واجهات خارجية، مسابح، صالات ريفية مودرن', 'Exterior facades, pool decks, living halls', 'الأكثر طلباً للواجهات', '#fcd34d', 'travertine', 'beige', '2550 kg/m³', '1.40%', '85 MPa', 4.5, 'سهلة جداً'),
('tr-1', 'أفيون وايت', 'Afyon White', 'turkish', 'أبيض ناصع شفاف عالي النقاء مستخرج من أفيون التاريخية', 'تركيا / Turkey', 'رخام أفيون الأبيض الشهير', 'Afyon Pure White', 'لامع كريستالي', 'حمامات ملكية، صالات، قصور', 'Royal baths, main lounges, palaces', 'VIP', '#ffffff', 'marble', 'white', '2715 kg/m³', '0.12%', '140 MPa', 4.7, 'متوسطة'),
('tr-2', 'موغلا وايت', 'Mugla White', 'turkish', 'أبيض بعروق رمادية متقاطعة واقتصادي عالي المتانة', 'تركيا / Turkey', 'رخام موغلا وايت التركي', 'Mugla Turkish White', 'لامع / مطفي', 'أرضيات فلل، مجمعات سكنية، أبراج', 'Full villa floors, residential projects', 'الأكثر طلباً', '#f1f5f9', 'marble', 'white', '2690 kg/m³', '0.24%', '122 MPa', 4.3, 'سهلة'),
('tr-3', 'بوردر بيج', 'Burdur Beige', 'turkish', 'بيج كلاسيكي مشهور بنقاء لونه وتناسقه في المساحات الكبيرة', 'تركيا / Turkey', 'رخام بوردر بيج عالي الجودة', 'Burdur Beige Extra', 'لامع', 'أرضيات فلل ومجالس وفنادق كبرى', 'Villas, grand halls, 5-star hotels', 'مميز', '#fef08a', 'marble', 'beige', '2700 kg/m³', '0.19%', '130 MPa', 4.5, 'سهلة'),
('tr-4', 'تندرا جراي', 'Tundra Grey', 'turkish', 'رمادي سحابي مودرن بعروق بيضاء كالسيتية خفيفة', 'تركيا / Turkey', 'رخام تندرا جراي التركي', 'Famous Tundra Grey', 'لامع / هوند مطفي', 'صالات مودرن، حمامات عصرية، جدران تلفزيون', 'Modern living, media walls, master baths', 'الأكثر طلباً', '#64748b', 'marble', 'grey', '2710 kg/m³', '0.16%', '136 MPa', 4.6, 'سهلة'),
('tr-5', 'دينيزلي ترافرتين', 'Denizli Travertine', 'turkish', 'عاجي فاتح مسامي طبيعي عازل للحرارة والرطوبة', 'تركيا / Turkey', 'ترافرتين دينيزلي العالمي', 'Denizli Travertine', 'بوش هامر / مصقول / معتق', 'واجهات فلل، تيراس، حدائق، مسابح', 'Exterior facades, terraces, pool surrounds', 'شائع', '#fed7aa', 'travertine', 'beige', '2520 kg/m³', '1.50%', '82 MPa', 4.6, 'سهلة جداً'),
('tr-6', 'لايمستون تركي نقي', 'Turkish Limestone', 'turkish', 'أبيض عاجي مطفي بملمس مخملي عازل للأشعة', 'تركيا / Turkey', 'حجر لايمستون تركي نقي', 'Pure Turkish Limestone', 'هوند / بوش هامر', 'واجهات مودرن، قصور، تيراس خارجي', 'Modern facades, villas, exterior claddings', 'مميز', '#f8fafc', 'limestone', 'white', '2580 kg/m³', '1.10%', '95 MPa', 4.4, 'سهلة'),
('tr-7', 'فانتازي براون تركي', 'Fantasy Brown', 'turkish', 'تموجات ثلاثية الأبعاد بنية ورمادية وكريمية بصلابة تقارب الجرانيت', 'تركيا / Turkey', 'رخام فانتازي براون الفني', 'Fantasy Brown Marble', 'بوكماتش / ساتين ملمس جلد', 'أسطح مطابخ خارقة، طاولات طعام، جدران بوكماتش', 'Heavy kitchen tops, islands, dining tables', 'VIP', '#78350f', 'marble', 'brown', '2780 kg/m³', '0.10%', '160 MPa', 4.9, 'سهلة جداً'),

-- Portuguese Marble & Limestone
('pt-1', 'إستريموز وايت', 'Estremoz White', 'portuguese', 'أبيض ناصع بتعريقات بلورية دقيقة ولمسات وردية خفية', 'البرتغال / Portugal', 'إستريموز أبيض نخب أول', 'Estremoz Extra White', 'لامع عالي النقاء', 'أرضيات فلل مودرن، قصور، أجنحة خاصة', 'Modern villa floors, palace suites', 'VIP', '#ffffff', 'marble', 'white', '2710 kg/m³', '0.14%', '135 MPa', 4.6, 'متوسطة'),
('pt-2', 'موليانوس كلاسيك', 'Moleanos Classic', 'portuguese', 'بيج رملي كلسي بنقاط أحفورية متناسقة عالية الصلابة', 'البرتغال / Portugal', 'حجر موليانوس البرتغالي', 'Moleanos Limestone', 'هوند مطفي / بوش هامر', 'واجهات قصور وفلل، أرضيات خارجية وداخلية', 'Palace facades, villa floors, terraces', 'الأكثر طلباً', '#fef3c7', 'limestone', 'beige', '2610 kg/m³', '1.20%', '105 MPa', 4.7, 'سهلة جداً'),
('pt-3', 'موليانوس فاين', 'Moleanos Fine', 'portuguese', 'بيج فاتح بنقاوة ناعمة جداً وخالية من الشوائب للواجهات الحديثة', 'البرتغال / Portugal', 'موليانوس فاين فائق النعومة', 'Moleanos Fine Grain', 'مطفي ناعم / ساند بلاست', 'واجهات فلل مودرن فخمة', 'Modern luxury minimalist facades', 'VIP', '#fffbeb', 'limestone', 'beige', '2620 kg/m³', '0.95%', '112 MPa', 4.8, 'سهلة'),
('pt-4', 'سينزا أزول برتغالي', 'Cinza Azul Blue-Grey', 'portuguese', 'رمادي مائل للزرقة بمظهر بحري أوروبي فريد', 'البرتغال / Portugal', 'حجر سينزا أزول البرتغالي', 'Cinza Azul Blue-Grey', 'لامع / بوش هامر', 'حمامات مودرن، واجهات مكاتب، لاندسكيب', 'Spa bathrooms, office claddings, landscape', 'VIP', '#0284c7', 'limestone', 'blue', '2650 kg/m³', '0.85%', '120 MPa', 4.6, 'سهلة'),

-- Greek White Marble
('gr-1', 'ثاسوس سوبر وايت', 'Thassos Super White', 'greek', 'أبيض ثلجي ناصع كريستالي 100% بدون أي عروق نهائياً', 'اليونان / Greece', 'رخام ثاسوس الأنقى عالمياً', 'Purest White Marble on Earth', 'لامع كريستالي عالي الانعكاس', 'قصور ملكية، مساجد، حمامات كبار الشخصيات', 'Royal palaces, mosques, VIP master baths', 'Ultra VIP', '#ffffff', 'marble', 'white', '2850 kg/m³', '0.08%', '165 MPa', 4.9, 'متوسطة'),
('gr-2', 'فولاكاس', 'Volakas', 'greek', 'أبيض عاجي بعروق رمادية وبنفسجية قطيفة متدفقة كالأمواج', 'اليونان / Greece', 'رخام فولاكاس اليوناني الشهير', 'Volakas Greek Classical', 'بوكماتش لامع / هوند', 'بوكماتش جداري، أرضيات فلل كبرى، مجالس', 'Bookmatch feature walls, villa floors, majlis', 'الأكثر طلباً', '#f1f5f9', 'marble', 'white', '2720 kg/m³', '0.15%', '138 MPa', 4.6, 'متوسطة'),
('gr-3', 'أريستون وايت', 'Ariston White', 'greek', 'أبيض ناصع بعروق رمادية كالدخان بنعومة فائقة', 'اليونان / Greece', 'رخام أريستون اليوناني الفاخر', 'Ariston White Greek', 'لامع / بوكماتش', 'صالات القصور، مغاسل معلقة، أجنحة فندقية', 'Grand salon floors, suspended vanities', 'VIP', '#ffffff', 'marble', 'white', '2730 kg/m³', '0.13%', '142 MPa', 4.7, 'متوسطة'),
('gr-4', 'سيفيك رويال وايت', 'Sivec Royal White', 'greek', 'أبيض موحد نقي مع انعكاس ضوئي ساطع وبلورات دقيقة', 'اليونان / مقدونيا', 'رخام سيفيك الأبيض الملكي', 'Sivec Royal White', 'لامع', 'مساجد كبرى، صالات استقبال، واجهات داخلية', 'Grand mosques, palace halls, interior facades', 'VIP', '#ffffff', 'marble', 'white', '2740 kg/m³', '0.11%', '146 MPa', 4.8, 'متوسطة'),

-- Saudi Marble & Granite
('sa-1', 'بني نجران الأصلي', 'Najran Brown Granite', 'saudi', 'بني جرانيتي شوكولاتي عالي الصلابة والكثافة', 'المملكة العربية السعودية / نجران', 'جرانيت بني نجران الشهير', 'Famous Najran Brown Granite', 'لامع / فليميد حراري / بوش هامر', 'واجهات أبراج، ساحات عامة، كاونترات مطابخ ثقيلة', 'Skyscraper facades, public plazas, heavy kitchens', 'صلابة وجودة', '#451a03', 'granite', 'brown', '2850 kg/m³', '0.05%', '210 MPa', 5.0, 'سهلة جداً'),
('sa-2', 'نجران بلاك جرانيت', 'Najran Black Granite', 'saudi', 'أسود جرانيتي فاحم فائق الصلابة ومقاوم للحرارة والخدش', 'المملكة العربية السعودية / نجران', 'جرانيت نجران الأسود', 'Najran Black Granite', 'لامع / فليميد', 'أسطح مطابخ مقاومة للدهون والحرارة، واجهات', 'Heavy duty kitchen tops, exterior facades', 'صلابة وجودة', '#020617', 'granite', 'black', '2900 kg/m³', '0.04%', '225 MPa', 5.0, 'سهلة جداً'),
('sa-3', 'نجران جراي جرانيت', 'Najran Gray Granite', 'saudi', 'رمادي جرانيتي متناسق بنقاط بلورية متينة', 'المملكة العربية السعودية / نجران', 'جرانيت نجران جراي', 'Najran Gray Granite', 'لامع / فليميد', 'مشاريع حكومية، ساحات مشاة، مواقف سيارات', 'Government projects, pedestrian plazas', 'صلابة وجودة', '#64748b', 'granite', 'grey', '2820 kg/m³', '0.06%', '200 MPa', 5.0, 'سهلة جداً'),
('sa-4', 'بيانكو كريستال السعودي', 'Saudi Bianco Cristal', 'saudi', 'أبيض كريستالي متلألئ بنقاط كوارتز فضية صلبة', 'المملكة العربية السعودية', 'جرانيت بيانكو كريستال', 'Saudi Bianco Cristal Granite', 'لامع كريستالي / فليميد', 'أسطح كاونترات، أرضيات صالات، واجهات خارجية', 'Kitchen counters, salon floors, exterior cladding', 'VIP', '#ffffff', 'granite', 'white', '2790 kg/m³', '0.07%', '195 MPa', 4.9, 'سهلة جداً'),
('sa-5', 'رويال روز سعودي', 'Royal Rose (Saudi)', 'saudi', 'وردي ملكي متبلور عالي الفخامة والتحمل', 'المملكة العربية السعودية', 'جرانيت رويال روز السعودي', 'Saudi Royal Rose Granite', 'لامع / فليميد', 'أرضيات قصور، واجهات مداخل، أروقة', 'Palace floors, entrance walls, colonnades', 'VIP', '#f43f5e', 'granite', 'pink', '2810 kg/m³', '0.06%', '205 MPa', 4.9, 'سهلة جداً'),

-- Riyadh & Nassah Stone
('rs-1', 'حجر الرياض الأبيض', 'White Riyadh Stone', 'riyadh-stone', 'أبيض عاجي طبيعي يعزل الحرارة بكفاءة ممتازة للواجهات', 'المملكة العربية السعودية / الرياض', 'حجر الرياض الأبيض النقي', 'Pure White Riyadh Stone', 'منشور ناعم / مجلي / مفرز مودرن', 'واجهات فلل مودرن وكلاسيك، أسوار، مداخل', 'Modern & classic facades, boundary walls', 'الأكثر طلباً للواجهات', '#f8fafc', 'stone', 'white', '2450 kg/m³', '2.10%', '65 MPa', 4.7, 'سهلة'),
('rs-2', 'حجر الرياض الكريمي', 'Cream Riyadh Stone', 'riyadh-stone', 'كريمي دافئ متناسق وفاخر ينسجم مع الإضاءة الليلية', 'المملكة العربية السعودية / الرياض', 'حجر الرياض الكريمي الفاخر', 'Cream Riyadh Natural Stone', 'منشور ناعم / مجلي / بوش هامر', 'واجهات قصور وفلل، أقواس ديكورية، أعمدة', 'Palace claddings, decorative arches, pillars', 'مميز', '#fef3c7', 'stone', 'beige', '2460 kg/m³', '2.00%', '68 MPa', 4.7, 'سهلة'),
('rs-3', 'حجر الرياض الأصفر الصحراوي', 'Yellow Riyadh Stone', 'riyadh-stone', 'أصفر صحراوي دافئ بملمس طبيعي يجسد التراث الأصيل', 'المملكة العربية السعودية / الرياض', 'حجر طبيعي سعودي أصيل', 'Authentic Saudi Natural Stone', 'منشور / مجلي / بوش هامر / طبزة', 'واجهات فلل تراثية ومودرن، أسوار، شلالات', 'Heritage & modern facades, boundary walls', 'الخيار الأول للواجهات', '#fde047', 'stone', 'gold', '2440 kg/m³', '2.30%', '62 MPa', 4.6, 'سهلة'),
('rs-4', 'حجر نساح الطبيعي الفاخر', 'Natural Nassah Stone', 'riyadh-stone', 'أبيض مشوب بعاجي نقي صلب بمسامية منخفضة جداً', 'المملكة العربية السعودية / نساح', 'حجر نساح الطبيعي الشهير', 'Famous Nassah Natural Stone', 'منشور ناعم / مفرز هندسي / مجلي', 'واجهات فلل راقية وقصور، قباب، تكسيات مودرن', 'High-end villa cladding, modern geometric panels', 'نخب أول', '#fafaf9', 'stone', 'white', '2520 kg/m³', '1.60%', '78 MPa', 4.9, 'سهلة جداً'),

-- Omani & World Exotic
('in-1', 'جرانيت جالاكسي هندي', 'Black Galaxy Granite (India)', 'omani', 'أسود ليلي فاحم بنقاط ذهبية متلألئة كالمجرة فائقة الصلابة', 'الهند / India', 'جرانيت هندي أصلي فائق الصلابة', 'Indian Black Galaxy Granite', 'لامع كريستالي عالي اللمعان', 'كاونترات مطابخ، جزر المطابخ، أرضيات صالات، مغاسل', 'Kitchen countertops, islands, luxury flooring', 'الأكثر شهرة (Top Seller)', '#020617', 'granite', 'black', '2980 kg/m³', '0.03%', '240 MPa', 5.0, 'سهلة جداً'),
('om-1', 'أوريكس عماني ممتاز', 'Oryx Omani Marble', 'omani', 'بيج رملي صحراوي بصلابة ممتازة وسعر اقتصادي راقي', 'سلطنة عمان / Oman', 'رخام أوريكس عماني ممتاز', 'Omani Oryx Marble', 'لامع / هوند مطفي', 'أرضيات فلل كاملة، مشاريع كبرى، مجمعات', 'Villa flooring, commercial towers, lobbies', 'الأكثر طلباً', '#fef3c7', 'marble', 'beige', '2690 kg/m³', '0.21%', '128 MPa', 4.5, 'سهلة جداً'),
('om-2', 'ديليكات كريم فاخر', 'Delicate Cream Omani', 'omani', 'كريمي ناعم كالحرير فائق التجانس والصفاء اللوني', 'عمان / عالمي', 'رخام ديليكات كريم الفاخر', 'Delicate Cream Premium', 'لامع / هوند', 'أرضيات فلل، غرف نوم ماستر، صالات معيشة', 'Full villa floors, master bedrooms, salons', 'مميز', '#fffbeb', 'marble', 'beige', '2700 kg/m³', '0.17%', '134 MPa', 4.6, 'سهلة')
ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    category_id = EXCLUDED.category_id,
    color_desc = EXCLUDED.color_desc,
    origin = EXCLUDED.origin,
    type_ar = EXCLUDED.type_ar,
    type_en = EXCLUDED.type_en,
    finish = EXCLUDED.finish,
    usage_ar = EXCLUDED.usage_ar,
    usage_en = EXCLUDED.usage_en,
    price_tier = EXCLUDED.price_tier,
    color_hex = EXCLUDED.color_hex,
    stone_type = EXCLUDED.stone_type,
    color_group = EXCLUDED.color_group,
    density = EXCLUDED.density,
    water_absorption = EXCLUDED.water_absorption,
    compressive_strength = EXCLUDED.compressive_strength,
    durability_score = EXCLUDED.durability_score,
    maintenance_tier = EXCLUDED.maintenance_tier;

-- 3. Populate Projects
INSERT INTO public.projects (id, title_ar, title_en, category, category_ar, category_en, location_ar, location_en, area, scope_ar, scope_en, stones_used, hero_grad, tags) VALUES
('proj-1', 'قصر الفخامة الملكي — حي حطين، الرياض', 'Royal Palace — Hittin District, Riyadh', 'palace', 'قصور ملكية وفلل كبرى', 'Palaces & Luxury Estates', 'الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia', '4,200 م²', 'توريد وتركيب رخام الأرضيات بنظام بوكماتش وتكسية الواجهات الخارجية كاملة بالحجر الطبيعي.', 'Supply and precision bookmatch waterjet installation for grand salons and full exterior natural stone facade.', ARRAY['it-3', 'gr-1', 'rs-4'], 'linear-gradient(135deg, #090d16 0%, #ca8a04 50%, #0f172a 100%)', ARRAY['Bookmatch', 'Riyadh Stone', 'Waterjet Flooring', 'Ultra Luxury']),
('proj-2', 'فندق بوتيك ريزيدنس الفاخر — كورنيش جدة', 'Boutique Residence Hotel — Jeddah Corniche', 'hotel', 'فنادق ومنتجعات سياحية', 'Hotels & Resorts', 'جدة، المملكة العربية السعودية', 'Jeddah, Saudi Arabia', '2,850 م²', 'تصميم وتنفيذ بهو الاستقبال الرئيسي وأجنحة VIP باستخدام الرخام السحابي ومغاسل رخام كالاكاتا فيولا المعلقة.', 'Main hotel lobby and VIP presidential suites featuring cloud grey marble and bespoke Calacatta Viola statement vanities.', ARRAY['tr-4', 'it-4', 'in-1'], 'linear-gradient(135deg, #0f172a 0%, #38bdf8 50%, #1e1b4b 100%)', ARRAY['Hotel Lobby', 'Calacatta Viola', 'Executive Suites']),
('proj-3', 'فيلا النرجس المودرن — شمال الرياض', 'Al-Narjis Contemporary Villa — North Riyadh', 'villa', 'فلل مودرن عصرية', 'Modern Contemporary Villas', 'الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia', '1,450 م²', 'واجهات هندسية ثلاثية الأبعاد بحجر نساح المنشور وموليانوس كلاسيك مع أرضيات داخلية مفتوحة.', 'Geometric 3D facade panels in Nassah stone and Moleanos limestone with seamless open-plan flooring.', ARRAY['rs-4', 'pt-2', 'es-3'], 'linear-gradient(135deg, #1e293b 0%, #fde047 50%, #0f172a 100%)', ARRAY['Modern Facade', 'Nassah Stone', 'Minimalist Villa']),
('proj-4', 'بنتهاوس الأبراج التنفيذية — الدمام', 'Executive Towers Penthouse — Dammam', 'penthouse', 'شقق وبنتهاوس VIP', 'Penthouses & High-End Interiors', 'الدمام، المنطقة الشرقية', 'Dammam, Eastern Province', '680 م²', 'كاونتر مطبخ وجزيرة طبخ ممتدة بجرانيت جالاكسي هندي مقاوم للحرارة وأرضيات صالون برخام فولاكاس.', 'Heavy duty kitchen island in Indian Black Galaxy Granite with Volakas marble salon floors.', ARRAY['in-1', 'gr-2', 'it-16'], 'linear-gradient(135deg, #020617 0%, #eab308 50%, #09090b 100%)', ARRAY['Kitchen Island', 'Black Galaxy', 'Volakas Living']),
('proj-5', 'مجمع واحة الأعمال والشركات — طريق الملك فهد، الرياض', 'Oasis Business Park — King Fahd Road, Riyadh', 'commercial', 'مباني إدارية وتجارية', 'Commercial & Corporate Towers', 'الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia', '6,500 م²', 'تكسية واجهات خارجية وأرصفة ساحات المشاة بجرانيت بني نجران الصلب وترافرتين تركي كلاسيكي عازل.', 'Heavy-traffic outdoor pedestrian plaza in Najran Brown Granite and insulated Turkish Travertine claddings.', ARRAY['sa-1', 'tr-26', 'sa-3'], 'linear-gradient(135deg, #1c1917 0%, #b45309 50%, #292524 100%)', ARRAY['Commercial Plaza', 'Najran Brown Granite', 'Heavy Traffic'])
ON CONFLICT (id) DO UPDATE SET
    title_ar = EXCLUDED.title_ar,
    title_en = EXCLUDED.title_en,
    category = EXCLUDED.category,
    category_ar = EXCLUDED.category_ar,
    category_en = EXCLUDED.category_en,
    location_ar = EXCLUDED.location_ar,
    location_en = EXCLUDED.location_en,
    area = EXCLUDED.area,
    scope_ar = EXCLUDED.scope_ar,
    scope_en = EXCLUDED.scope_en,
    stones_used = EXCLUDED.stones_used,
    hero_grad = EXCLUDED.hero_grad,
    tags = EXCLUDED.tags;
