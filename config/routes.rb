Rails.application.routes.draw do
  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end

  # Mount Action Cable for WebSocket connections
  mount ActionCable.server => '/cable'

  scope :rails do
    scope :active_storage do
      post "direct_uploads", to: "api/direct_uploads#create"
    end
  end

  passwordless_for :users

  post '/admin/sign_in', to: 'admin_sessions#create', as: :admin_sign_in

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  namespace :api do
    get "discover", to: "discover#index"

    resources :users, only: [] do
      get "me", on: :collection
      post "sign_out_user", on: :collection
      get "following", on: :collection
    end

    resources :events, param: :slug, only: [:index, :show, :create, :update, :destroy] do
      member do
        get :ical
      end
    end

    resources :performers, param: :slug, only: [:index, :show, :create, :update, :destroy] do
      member do
        post :follow
        delete :follow, action: :unfollow
      end
    end
    resources :experiences, only: [:create, :show] do
      collection do
        post :join
      end

      member do
        post :admin_token
        post :register
        get :registration_info
        post :open_lobby
        post :start
        post :pause
        post :resume
        post :clear_avatars
        patch :update_playbill
        post :avatar, to: 'experience_avatar#create'
      end

      resources(
        :blocks,
        controller: "experience_blocks",
        only: [:create, :update, :destroy]
      ) do
        member do
          post :open
          post :close
          post :hide
          post :detach_from_parent
          post :reorder
          post :set_column
          post :submit_poll_response
          post :submit_question_response
          post :submit_photo_upload_response
          post :submit_buzzer_response
          delete :clear_buzzer_responses

          post 'family_feud/auto_categorize', action: :auto_categorize
          post 'family_feud/generate_synthetic_answers', action: :generate_synthetic_answers
          patch 'family_feud/ai_context', action: :update_ai_context
          patch 'family_feud/question_ai_context', action: :update_question_ai_context
          post 'family_feud/add_bucket', action: :add_bucket
          patch 'family_feud/buckets/:bucket_id', action: :rename_bucket
          delete 'family_feud/buckets/:bucket_id', action: :delete_bucket
          patch 'family_feud/answers/:answer_id/bucket', action: :assign_answer
          post 'family_feud/start_playing', action: :start_playing
          post 'family_feud/reveal_bucket', action: :reveal_bucket
          post 'family_feud/show_x', action: :show_x
          post 'family_feud/theme_music', action: :set_theme_music
          post 'family_feud/theme_music/restart', action: :restart_theme_music
          post 'family_feud/next_question', action: :next_question
          post 'family_feud/restart_playing', action: :restart_playing
          post 'family_feud/restart_categorizing', action: :restart_categorizing
          post 'family_feud/restart_everything', action: :restart_everything

          post 'guess_who/start', action: :start_guess_who
          post 'guess_who/reroll_mystery', action: :reroll_guess_who_mystery
          patch 'guess_who/clues', action: :curate_guess_who_clues
          post 'guess_who/advance_clue', action: :advance_guess_who_clue
          post 'guess_who/monitor_view', action: :set_guess_who_monitor_view
          post 'guess_who/dispatch_poll', action: :dispatch_guess_who_poll
          post 'guess_who/conclude_poll', action: :conclude_guess_who_poll
          post 'guess_who/reveal', action: :reveal_guess_who
          post 'guess_who/theme_music', action: :set_guess_who_theme_music
          post 'guess_who/theme_music/restart', action: :restart_guess_who_theme_music

          post 'minigame/arithmetic/start', action: :start_minigame_arithmetic
          post 'minigame/arithmetic/end', action: :end_minigame_arithmetic
          post 'minigame/arithmetic/restart', action: :restart_minigame_arithmetic
          post 'minigame/arithmetic/responses', action: :submit_minigame_arithmetic_response

          post 'minigame/balloon_pump/start', action: :start_minigame_balloon_pump
          post 'minigame/balloon_pump/end', action: :end_minigame_balloon_pump
          post 'minigame/balloon_pump/restart', action: :restart_minigame_balloon_pump
          post 'minigame/balloon_pump/pump', action: :submit_minigame_balloon_pump_update

          post 'the_scene/start', action: :start_the_scene
          post 'the_scene/end', action: :end_the_scene
          post 'the_scene/force_next_scene', action: :force_next_the_scene
          patch 'the_scene/performers', action: :update_the_scene_performers
          post 'the_scene/buzzer', action: :press_the_scene_buzzer
          post 'the_scene/clear_top', action: :clear_the_scene_top
          post 'the_scene/clear/:suggestion_id', action: :clear_the_scene_suggestion
          post 'the_scene/clear_all', action: :clear_the_scene_all
          post 'the_scene/suggestions', action: :submit_the_scene_suggestion
          post 'the_scene/votes', action: :submit_the_scene_vote
        end

        # collection do
        #   post :batch_open
        # end
      end

      resources :segments, controller: 'experience_segments', only: [:create, :update, :destroy] do
        member do
          post :assign
        end
      end

      resources :participants, controller: 'experience_participants', only: [] do
        member do
          delete :kick
          get :submissions
        end
      end

      member do
        post 'debug/create_participants', to: 'debug#create_participants'
        post 'debug/get_participant_jwts', to: 'debug#get_participant_jwts'
      end
    end
  end

  get '/experiences/:code/register', to: 'spa#index', as: :experience_register
  get '/experiences/register', to: 'spa#index'
  get '/experiences/:code', to: 'spa#index', as: :experience_lobby

  get '*path', to: 'spa#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end

  root 'spa#index'
end
