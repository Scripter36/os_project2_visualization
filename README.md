## Introduction

A web application which can simulate os project 2

## How to run

* Install npm dependencies

```bash
npm install
```

* Run tailwind build

```bash
npm run build:css
```

* Open web server, and open index.html

## How to add custom scheduler

Edit `src/scheduler.js`. You should implement 5 functions:

* `init_scheduler()`: initialize your scheduler. It is called when reset button is clicked.

* `set_orientation(orientation)`: a system call to set current orientation. It is called when orientation is changed.

* `rotation_lock(low, high, type)`: a system call to lock range [low~high]. Type is either `READ` or `WRITE`. It returns id of lock. You should manage `lock_list` array, and type of element in `lock_list` is `{low: number, high: number, type: string, state: string}`. state is either `LOCKED` or `EXECUTING`. You can use state instead of mutex to implement your scheduler.

* `rotation_unlock(id)`: a system call to unlock lock id `id`. You should remove element from `lock_list` array.

* `exit_rotlock(id)`: a system call to manage a situation where a process is terminated while holding a lock. For convinience, we provide `id` instead of `task_struct`.