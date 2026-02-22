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

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  namespace :api do
    resources :users, only: [] do
      get "me", on: :collection
      post "sign_out_user", on: :collection
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
      end

      resources(
        :blocks,
        controller: "experience_blocks",
        only: [:create, :update]
      ) do
        member do
          post :open
          post :close
          post :hide
          post :submit_poll_response
          post :submit_question_response
          post :submit_multistep_form_response
          post :submit_mad_lib_response
          post :submit_photo_upload_response

          post 'family_feud/add_bucket', action: :add_bucket
          patch 'family_feud/buckets/:bucket_id', action: :rename_bucket
          delete 'family_feud/buckets/:bucket_id', action: :delete_bucket
          patch 'family_feud/answers/:answer_id/bucket', action: :assign_answer
        end

        # collection do
        #   post :batch_open
        # end
      end

      resources :participants, controller: 'experience_participants', only: [] do
        member do
          post :avatar
        end
      end

      member do
        post 'debug/create_participants', to: 'debug#create_participants'
        post 'debug/get_participant_jwts', to: 'debug#get_participant_jwts'
      end
    end
  end

  get '/experiences/register', to: 'spa#index'
  get '/experiences/:code', to: 'spa#index'

  get '*path', to: 'spa#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end

  root 'spa#index'
end
