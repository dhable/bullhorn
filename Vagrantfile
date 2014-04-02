# -*- mode: ruby -*-
# vi: set ft=ruby :


# Snippet of shell commands used to install a current version of node.js
# using apt-get. Extra work is needed due to the official apt repo being
# on v0.6.x.
$installNode = <<EOL
apt-get update
apt-get install --assume-yes python-software-properties python g++ make git
add-apt-repository --yes ppa:chris-lea/node.js
apt-get update
apt-get install --assume-yes nodejs
npm install -g forever
EOL


# Shell script to install and start the statsd monitoring package
# from github. Will log output to the stdout.log file.
$startStatsd = <<EOL
mkdir -p /opt/statsd
mkdir -p /var/log/statsd
git clone --depth 1 https://github.com/etsy/statsd.git /opt/statsd
cd /opt/statsd

cat << EOF > conf.js
{port: 8125, backends: ["./backends/console"]}
EOF

forever start -l /var/log/statsd/forever.log -o /var/log/statsd/stdout.log \
              -e /var/log/statsd/stderr.log --pidFile statsd.pid stats.js conf.js
EOL


# Shell script to start the bullhorn server using forever.
$startBullhorn = <<EOL
mkdir -p /var/log/jetway/bullhorn
cd /opt/jetway/bullhorn
npm install

forever start -l /var/log/jetway/bullhorn/forever.log -o /var/log/jetway/bullhorn/stdout.log \
              -e /var/log/jetway/bullhorn/stderr.log --append --pidFile bullhorn.pid app.js
EOL


# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"

  config.vm.network "forwarded_port", guest: 3000, host: 3001
  config.vm.synced_folder ".", "/opt/jetway/bullhorn"

  config.vm.provision :shell, :inline => $installNode
  config.vm.provision :shell, :inline => $startStatsd
  config.vm.provision :shell, :inline => $startBullhorn

end
