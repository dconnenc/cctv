Rails.application.routes.draw do
  passwordless_for :users

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  namespace :api do
    resources :experiences, only: [:create, :show] do
      member do
        post :join
        post :register
        post :open_lobby
        post :start
        post :pause
        post :resume
      end

      resources(
        :blocks,
        controller: "experience_blocks",
        only: [:create]
      ) do
        member do
          post :open
          post :close
        end

        # collection do
        #   post :batch_open
        # end
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
