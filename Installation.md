Installation steps for Data Pipeline Infrastructure
-

Sunbird Learning Platform installation is automated with ansible as configuration management tool.

```sh
devops/
  playbooks.yml
  inventory/
    sample_env/
      group_vars/
        lp.yml
      hosts
  roles/
    ansible-roles
```

Above depicts the folder structure for ansible code distribution.

All the variables which can have default values, for example **cassandra_ip_address** is dynamically derived or constant values assigned and added in to defaults.
You can override that in group_vars though.

### Variables

TODO

### Playbooks to run in order

General ansible execute format is 

`ansible-playbook -i inventory/sample_env/hosts <playbook.yml>`

- cassandra.yml
- 
