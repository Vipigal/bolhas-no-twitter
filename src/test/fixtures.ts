import type {
  Author,
  ClusterMeta,
  EventData,
  EventMeta,
  GroupMap,
  GroupMapLabel,
  Index,
  Media,
  Slot,
  Tweet,
} from "../types";

export function buildTweet(overrides: Partial<Tweet> = {}): Tweet {
  return {
    id: "1",
    text: "",
    created_at: "2023-01-08T15:00:00Z",
    lang: null,
    source: null,
    possibly_sensitive: null,
    reply_settings: null,
    conversation_id: null,
    in_reply_to_user_id: null,
    metrics: {
      retweet_count: null,
      reply_count: null,
      like_count: null,
      quote_count: null,
      bookmark_count: null,
      impression_count: null,
    },
    entities: { urls: [], hashtags: [], mentions: [] },
    referenced_tweets: [],
    url: "https://x.com/i/web/status/1",
    media: [],
    ...overrides,
  };
}

export function buildMedia(overrides: Partial<Media> = {}): Media {
  return {
    media_key: "m1",
    type: "photo",
    url: "https://example.test/foto.jpg",
    preview_image_url: null,
    width: null,
    height: null,
    alt_text: null,
    ...overrides,
  };
}

export function buildAuthor(overrides: Partial<Author> = {}): Author {
  return {
    id: "a1",
    username: "autor",
    name: "Autor",
    description: null,
    location: null,
    url: null,
    profile_image_url: null,
    protected: null,
    verified: null,
    verified_type: null,
    created_at: null,
    metrics: { followers_count: null, following_count: null, tweet_count: null, listed_count: null },
    ...overrides,
  };
}

export function buildSlot(overrides: Partial<Slot> = {}): Slot {
  const tweet = overrides.tweet === undefined ? buildTweet() : overrides.tweet;
  const author = overrides.author === undefined ? buildAuthor() : overrides.author;
  return {
    community: 1,
    group: 1,
    rank: 1,
    k: 100,
    origin: "amplified",
    lift: null,
    tweet_id: tweet?.id ?? "1",
    rt_cluster: 10,
    rt_graph: 20,
    rt_event: 30,
    purity: 0.5,
    also_in: [],
    status: "hydrated",
    error: null,
    tweet,
    author_id: author?.id ?? null,
    author,
    author_status: "hydrated",
    ...overrides,
  };
}

export function buildCluster(overrides: Partial<ClusterMeta> = {}): ClusterMeta {
  return {
    community: 1,
    group: 1,
    label: "Grupo 1",
    color: "#e15759",
    n_nodes: 100,
    frac_nodes: 0.5,
    intra_weight_frac: 0.5,
    k: 100,
    n_selected: 100,
    n_hydrated: 100,
    n_not_found: 0,
    n_not_authorized: 0,
    n_other_errors: 0,
    n_pending: 0,
    attrition: 0,
    n_tail_selected: 0,
    n_tail_hydrated: 0,
    top_accounts: [],
    summary: null,
    curation: null,
    shared: null,
    shared_with: null,
    ...overrides,
  };
}

export function buildEvent(overrides: Partial<EventMeta> = {}): EventMeta {
  const slug = overrides.slug ?? "evento";
  return {
    slug,
    name: "Evento",
    event_date: "2023-01-08",
    n_nodes: 200,
    n_edges: 400,
    n_communities: 2,
    run_config: {},
    selection: { k: 100, k_small: 20, min_frac: 0.01, small_weight_frac: 0.05 },
    clusters: [buildCluster()],
    files: { tweets: `${slug}/tweets.json`, layout: `${slug}/layout.json` },
    ...overrides,
  };
}

export function buildIndex(overrides: Partial<Index> = {}): Index {
  return {
    generated_at: "2026-01-01T00:00:00Z",
    palette: ["#e15759", "#4e79a7"],
    events: [buildEvent()],
    ...overrides,
  };
}

export function buildEventData(overrides: Partial<EventData> = {}): EventData {
  return {
    meta: buildEvent(),
    slots: [buildSlot()],
    ...overrides,
  };
}

export function buildGroupLabel(overrides: Partial<GroupMapLabel> = {}): GroupMapLabel {
  return {
    community: 1,
    group: 1,
    label_x: 0.5,
    label_y: 0.5,
    anchor: "bottom",
    ...overrides,
  };
}

export function buildGroupMap(overrides: Partial<GroupMap> = {}): GroupMap {
  return {
    groups: [buildGroupLabel()],
    dominant_pairs: [],
    grid: { n: 1, cells: [1] },
    params: {},
    ...overrides,
  };
}
