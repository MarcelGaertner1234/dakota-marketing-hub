-- ============================================
-- MIGRATION 002: Storytelling-Blätter
-- Chesa-Rosatsch-inspirierte A5 Micro-Stories
-- für Gerichte, Drinks, das Haus, die Crew, Orte
-- ============================================

-- Enums
CREATE TYPE story_category AS ENUM ('dish', 'drink', 'house', 'crew', 'location');
CREATE TYPE story_status AS ENUM ('draft', 'published');

-- Hauptabelle
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  category story_category NOT NULL DEFAULT 'dish',
  paragraph_1 TEXT NOT NULL,
  paragraph_2 TEXT,
  paragraph_3 TEXT,
  illustration_url TEXT,
  footer_signature TEXT NOT NULL DEFAULT 'Ihre Dakota Crew',
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  linked_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  status story_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_category ON stories(category);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_event ON stories(linked_event_id);
CREATE INDEX idx_stories_concept ON stories(linked_concept_id);

-- ============================================
-- STORAGE BUCKET für Illustrationen
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('story-illustrations', 'story-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED: Die 3 Kern-Stories aus der Kadersitzung
-- ============================================

INSERT INTO stories (title, subtitle, category, paragraph_1, paragraph_2, paragraph_3, status, sort_order) VALUES
  (
    'Dakota',
    'Warum wir nach einem Flugzeug heissen',
    'house',
    'Die DC-3 "Dakota" war mehr als ein Flugzeug. Sie war das Versprechen, dass weit voneinander entfernte Menschen zusammenkommen können — und dass jede Reise irgendwo landen muss.',
    'Wir haben unsere Lounge nach ihr benannt, weil sie genau das sein soll: ein Ort zum Ankommen. Für Gäste die den Reichenbachfall gesehen haben und durstig sind. Für Einheimische nach Feierabend. Für Biker, Skifahrer, Wanderer, Familien. Und für alle die einfach einen Ort brauchen, an dem man sich wie zuhause fühlt, ohne je hier gewohnt zu haben.',
    'Willkommen an Bord. Schön dass ihr gelandet seid.',
    'published',
    1
  ),
  (
    'Die Meringue',
    'Ein Stück Meiringen auf dem Löffel',
    'dish',
    'Man erzählt sich, ein italienischer Konditor namens Gasparini habe sie im 17. Jahrhundert hier erfunden — in unserem Dorf, im Haslital, am Fusse der Berge. Seither trägt die süsseste aller Wolken unseren Namen.',
    'Wir servieren sie so wie sie sein muss: luftig, knusprig, bescheiden. Dazu eine Kugel hausgemachtes Eis und ein Löffel Doppelrahm aus dem Berner Oberland — wie es die Grossmütter des Haslitals seit Generationen machen.',
    'Ein Stück Dorfstolz. Ein Stück Meiringen. Ein Stück von uns.',
    'published',
    2
  ),
  (
    'Der Reichenbach',
    'Ein Drink zu Ehren eines alten Falls',
    'drink',
    '1891 stürzte hier oben der berühmteste Detektiv der Welt in den Tod — oder auch nicht, je nachdem wem man glaubt. Sicher ist nur: Seit über 130 Jahren kommen Menschen aus aller Welt nach Meiringen, um dem Reichenbachfall einen Besuch abzustatten. Und viele von ihnen landen am Ende bei uns.',
    'Der "Reichenbach" ist unser Tribut: Schweizer Gin aus dem Berner Oberland, ein Hauch Holunder aus dem Haslital, Tonic aus alpinen Quellen — und ein Blatt Pfefferminze, das schwebt wie ein gewisser Herr Holmes über dem Wasser.',
    'Ob er wirklich gefallen ist? Trink einen. Entscheide selbst.',
    'published',
    3
  );
