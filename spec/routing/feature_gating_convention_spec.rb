require "rails_helper"

RSpec.describe "route feature classification" do
  def mounted_paths
    ["/cable"]
  end

  def gated_routes
    [
      "GET /api/discover api/discover#index [discover]",
      "GET /api/events api/events#index [events]",
      "POST /api/events api/events#create [events]",
      "GET /api/events/:slug api/events#show [events]",
      "PATCH /api/events/:slug api/events#update [events]",
      "PUT /api/events/:slug api/events#update [events]",
      "DELETE /api/events/:slug api/events#destroy [events]",
      "GET /api/events/:slug/ical api/events#ical [events]",
      "GET /api/users/following api/users#following [performers]",
      "GET /api/performers api/performers#index [performers]",
      "POST /api/performers api/performers#create [performers]",
      "GET /api/performers/:slug api/performers#show [performers]",
      "PATCH /api/performers/:slug api/performers#update [performers]",
      "PUT /api/performers/:slug api/performers#update [performers]",
      "DELETE /api/performers/:slug api/performers#destroy [performers]",
      "POST /api/performers/:slug/follow api/performers#follow [performers]",
      "DELETE /api/performers/:slug/follow api/performers#unfollow [performers]",
    ]
  end

  def ungated_routes
    [
      # Core experience API: experiences, blocks, segments, participants, feedback, current user.
      "DELETE /api/experiences/:experience_id/blocks/:id api/experience_blocks#destroy",
      "DELETE /api/experiences/:experience_id/blocks/:id/clear_buzzer_responses api/experience_blocks#clear_buzzer_responses",
      "DELETE /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id api/experience_blocks#delete_bucket",
      "DELETE /api/experiences/:experience_id/participants/:id/kick api/experience_participants#kick",
      "DELETE /api/experiences/:experience_id/segments/:id api/experience_segments#destroy",
      "GET /api/experiences api/experiences#index",
      "GET /api/experiences/:experience_id/participants/:id/submissions api/experience_participants#submissions",
      "GET /api/experiences/:id/cosmetics api/experience_cosmetics#index",
      "GET /api/experiences/:id/registration_info api/experiences#registration_info",
      "GET /api/users/me api/users#me",
      "PATCH /api/experiences/:experience_id/blocks/:id api/experience_blocks#update",
      "PATCH /api/experiences/:experience_id/blocks/:id/family_feud/ai_context api/experience_blocks#update_ai_context",
      "PATCH /api/experiences/:experience_id/blocks/:id/family_feud/answers/:answer_id/bucket api/experience_blocks#assign_answer",
      "PATCH /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id api/experience_blocks#rename_bucket",
      "PATCH /api/experiences/:experience_id/blocks/:id/family_feud/question_ai_context api/experience_blocks#update_question_ai_context",
      "PATCH /api/experiences/:experience_id/blocks/:id/guess_who/clues api/experience_blocks#curate_guess_who_clues",
      "PATCH /api/experiences/:experience_id/blocks/:id/the_scene/performers api/experience_blocks#update_the_scene_performers",
      "PATCH /api/experiences/:experience_id/segments/:id api/experience_segments#update",
      "PATCH /api/experiences/:id/update_playbill api/experiences#update_playbill",
      "PATCH /api/feedbacks/:id api/feedbacks#update",
      "POST /api/experiences api/experiences#create",
      "POST /api/experiences/:experience_id/blocks api/experience_blocks#create",
      "POST /api/experiences/:experience_id/blocks/:id/close api/experience_blocks#close",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/drawings api/experience_blocks#submit_collaborative_drawing",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/end api/experience_blocks#end_collaborative_drawing_round",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/photos api/experience_blocks#submit_collaborative_drawing_photo",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/restart api/experience_blocks#restart_collaborative_drawing",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/reveal_composites api/experience_blocks#reveal_collaborative_drawing_composites",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/select_photos api/experience_blocks#select_collaborative_drawing_photos",
      "POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/start api/experience_blocks#start_collaborative_drawing_round",
      "POST /api/experiences/:experience_id/blocks/:id/detach_from_parent api/experience_blocks#detach_from_parent",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/add_bucket api/experience_blocks#add_bucket",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/auto_categorize api/experience_blocks#auto_categorize",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/generate_synthetic_answers api/experience_blocks#generate_synthetic_answers",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/next_question api/experience_blocks#next_question",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_categorizing api/experience_blocks#restart_categorizing",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_everything api/experience_blocks#restart_everything",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_playing api/experience_blocks#restart_playing",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/reveal_bucket api/experience_blocks#reveal_bucket",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/show_x api/experience_blocks#show_x",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/start_playing api/experience_blocks#start_playing",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/theme_music api/experience_blocks#set_theme_music",
      "POST /api/experiences/:experience_id/blocks/:id/family_feud/theme_music/restart api/experience_blocks#restart_theme_music",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/advance_clue api/experience_blocks#advance_guess_who_clue",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/conclude_poll api/experience_blocks#conclude_guess_who_poll",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/dispatch_poll api/experience_blocks#dispatch_guess_who_poll",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/monitor_view api/experience_blocks#set_guess_who_monitor_view",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/reroll_mystery api/experience_blocks#reroll_guess_who_mystery",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/reveal api/experience_blocks#reveal_guess_who",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/start api/experience_blocks#start_guess_who",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/theme_music api/experience_blocks#set_guess_who_theme_music",
      "POST /api/experiences/:experience_id/blocks/:id/guess_who/theme_music/restart api/experience_blocks#restart_guess_who_theme_music",
      "POST /api/experiences/:experience_id/blocks/:id/hide api/experience_blocks#hide",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/arithmetic/end api/experience_blocks#end_minigame_arithmetic",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/arithmetic/responses api/experience_blocks#submit_minigame_arithmetic_response",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/arithmetic/restart api/experience_blocks#restart_minigame_arithmetic",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/arithmetic/start api/experience_blocks#start_minigame_arithmetic",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/end api/experience_blocks#end_minigame_balloon_pump",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/pump api/experience_blocks#submit_minigame_balloon_pump_update",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/restart api/experience_blocks#restart_minigame_balloon_pump",
      "POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/start api/experience_blocks#start_minigame_balloon_pump",
      "POST /api/experiences/:experience_id/blocks/:id/open api/experience_blocks#open",
      "POST /api/experiences/:experience_id/blocks/:id/reorder api/experience_blocks#reorder",
      "POST /api/experiences/:experience_id/blocks/:id/set_column api/experience_blocks#set_column",
      "POST /api/experiences/:experience_id/blocks/:id/submit_buzzer_response api/experience_blocks#submit_buzzer_response",
      "POST /api/experiences/:experience_id/blocks/:id/submit_newsletter_response api/experience_blocks#submit_newsletter_response",
      "POST /api/experiences/:experience_id/blocks/:id/submit_photo_upload_response api/experience_blocks#submit_photo_upload_response",
      "POST /api/experiences/:experience_id/blocks/:id/submit_poll_response api/experience_blocks#submit_poll_response",
      "POST /api/experiences/:experience_id/blocks/:id/submit_question_response api/experience_blocks#submit_question_response",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/buzzer api/experience_blocks#press_the_scene_buzzer",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/clear/:suggestion_id api/experience_blocks#clear_the_scene_suggestion",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/clear_all api/experience_blocks#clear_the_scene_all",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/clear_top api/experience_blocks#clear_the_scene_top",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/end api/experience_blocks#end_the_scene",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/force_next_scene api/experience_blocks#force_next_the_scene",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/start api/experience_blocks#start_the_scene",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/suggestions api/experience_blocks#submit_the_scene_suggestion",
      "POST /api/experiences/:experience_id/blocks/:id/the_scene/votes api/experience_blocks#submit_the_scene_vote",
      "POST /api/experiences/:experience_id/segments api/experience_segments#create",
      "POST /api/experiences/:experience_id/segments/:id/assign api/experience_segments#assign",
      "POST /api/experiences/:id/admin_token api/experiences#admin_token",
      "POST /api/experiences/:id/avatar api/experience_avatar#create",
      "POST /api/experiences/:id/clear_avatars api/experiences#clear_avatars",
      "POST /api/experiences/:id/debug/create_participants api/debug#create_participants",
      "POST /api/experiences/:id/debug/get_participant_jwts api/debug#get_participant_jwts",
      "POST /api/experiences/:id/open_lobby api/experiences#open_lobby",
      "POST /api/experiences/:id/pause api/experiences#pause",
      "POST /api/experiences/:id/register api/experiences#register",
      "POST /api/experiences/:id/resume api/experiences#resume",
      "POST /api/experiences/:id/start api/experiences#start",
      "POST /api/experiences/join api/experiences#join",
      "POST /api/feedbacks api/feedbacks#create",
      "POST /api/users/sign_out_user api/users#sign_out_user",
      "PUT /api/experiences/:experience_id/blocks/:id api/experience_blocks#update",
      "PUT /api/experiences/:experience_id/segments/:id api/experience_segments#update",
      "PUT /api/feedbacks/:id api/feedbacks#update",

      # Health check for load balancers.
      "GET /up rails/health#show",

      # PWA manifest and service worker, served on every tenant.
      "GET /manifest rails/pwa#manifest",
      "GET /service-worker rails/pwa#service_worker",

      # Passwordless user sign-in and sign-out.
      "GET /users/sign_in passwordless/sessions#new",
      "GET /users/sign_in/:id passwordless/sessions#show",
      "GET /users/sign_in/:id/:token passwordless/sessions#confirm",
      "GET|DELETE /users/sign_out passwordless/sessions#destroy",
      "PATCH /users/sign_in/:id passwordless/sessions#update",
      "POST /users/sign_in passwordless/sessions#create",

      # Admin session sign-in.
      "POST /admin/sign_in admin_sessions#create",

      # Direct uploads used by blocks, avatars and feedback.
      "POST /rails/active_storage/direct_uploads active_storage/direct_uploads#create",
      "POST /rails/active_storage/direct_uploads api/direct_uploads#create",
      "POST /rails/active_storage/feedback_direct_uploads api/feedback_direct_uploads#create",

      # Active Storage blob, representation and disk serving.
      "GET /rails/active_storage/blobs/:signed_id/*filename active_storage/blobs/redirect#show",
      "GET /rails/active_storage/blobs/proxy/:signed_id/*filename active_storage/blobs/proxy#show",
      "GET /rails/active_storage/blobs/redirect/:signed_id/*filename active_storage/blobs/redirect#show",
      "GET /rails/active_storage/disk/:encoded_key/*filename active_storage/disk#show",
      "GET /rails/active_storage/representations/:signed_blob_id/:variation_key/*filename active_storage/representations/redirect#show",
      "GET /rails/active_storage/representations/proxy/:signed_blob_id/:variation_key/*filename active_storage/representations/proxy#show",
      "GET /rails/active_storage/representations/redirect/:signed_blob_id/:variation_key/*filename active_storage/representations/redirect#show",
      "PUT /rails/active_storage/disk/:encoded_token active_storage/disk#update",
    ]
  end

  def classifiable_routes
    RouteClassification.routes.reject do |route|
      RouteClassification.mounted?(route) || RouteClassification.spa?(route)
    end
  end

  it "mounts only the known Rack apps" do
    mounted = RouteClassification.routes.select { |route| RouteClassification.mounted?(route) }

    expect(mounted.map { |route| RouteClassification.path(route) }.uniq).to eq(mounted_paths)
  end

  it "gates each feature route under its feature" do
    gated = classifiable_routes.filter_map do |route|
      feature = RouteClassification.feature_for(route)
      "#{RouteClassification.label(route)} [#{feature}]" if feature
    end

    expect(gated.sort).to eq(gated_routes.sort)
  end

  it "lists every route that is not feature-gated, apart from mounts and SPA routes" do
    ungated = classifiable_routes
      .reject { |route| RouteClassification.feature_for(route) }
      .map { |route| RouteClassification.label(route) }

    expect(ungated.sort).to eq(ungated_routes.sort)
  end
end
