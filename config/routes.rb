Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  namespace :api do
    resources :sessions, only: [:create] do
      collection do
        post :join
      end
    end

    # Lobby routes
    get '/lobby/:code', to: 'lobby#show'
    post '/lobby/:code/join', to: 'lobby#join'
  end

  get '/join', to: 'application#index'
  get '/lobby/:sessionKey', to: 'application#index'

  get '*path', to: 'application#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end

  root 'application#index'
end
